export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const BUCKET = 'contractfiles'

type Params = { id: string; deptId: string }

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: contractId, deptId } = params

  const canViewAll = ['SUPER_ADMIN', 'LAWYER'].includes(user.role)
  const isOwnDept = user.departmentId === deptId
  if (!canViewAll && !isOwnDept) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cd = await prisma.contractDepartment.findUnique({
    where: { contractId_departmentId: { contractId, departmentId: deptId } },
    include: {
      files: {
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { id: true, name: true } } },
      },
    },
  })
  if (!cd) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const filesWithUrls = await Promise.all(
    cd.files.map(async (f) => {
      const { data } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(f.storagePath, 3600)
      return { ...f, signedUrl: data?.signedUrl ?? null }
    })
  )

  return NextResponse.json({ data: filesWithUrls })
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: contractId, deptId } = params

  const canUpload =
    user.role === 'SUPER_ADMIN' ||
    (['HEAD', 'EMPLOYEE'].includes(user.role) && user.departmentId === deptId)
  if (!canUpload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cd = await prisma.contractDepartment.findUnique({
    where: { contractId_departmentId: { contractId, departmentId: deptId } },
    include: { contract: true },
  })
  if (!cd) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (cd.contract.status !== 'COLLECTING') {
    return NextResponse.json({ error: 'Загрузка разрешена только в статусе "Сбор информации"' }, { status: 400 })
  }
  if (cd.status === 'SUBMITTED') {
    return NextResponse.json({ error: 'Отдел уже сдал материалы — загрузка закрыта' }, { status: 400 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Недопустимый тип файла' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Файл превышает 20 МБ' }, { status: 400 })
  }

  // Уникальное имя если уже существует
  const existing = await prisma.departmentFile.findFirst({
    where: { contractDepartmentId: cd.id, filename: file.name },
  })
  const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
  const base = file.name.includes('.') ? file.name.slice(0, file.name.lastIndexOf('.')) : file.name
  const filename = existing ? `${base}_${Date.now()}.${ext}` : file.name
  const storagePath = `contracts/${contractId}/departments/${deptId}/${filename}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Ошибка загрузки файла: ' + uploadError.message }, { status: 500 })
  }

  const [departmentFile] = await prisma.$transaction([
    prisma.departmentFile.create({
      data: {
        contractDepartmentId: cd.id,
        filename,
        storagePath,
        uploadedBy: user.id,
      },
      include: { uploader: { select: { id: true, name: true } } },
    }),
    prisma.activityLog.create({
      data: {
        contractId,
        userId: user.id,
        action: 'department.file_uploaded',
        metadata: { departmentId: deptId, filename },
      },
    }),
  ])

  return NextResponse.json({ data: departmentFile }, { status: 201 })
}
