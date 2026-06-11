export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['LAWYER', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { departmentIds } = await req.json()
  if (!departmentIds?.length) {
    return NextResponse.json({ error: 'Выберите отделы' }, { status: 400 })
  }

  // Добавляем только новые отделы
  const existing = await prisma.contractDepartment.findMany({
    where: { contractId: params.id },
    select: { departmentId: true }
  })
  const existingIds = existing.map(e => e.departmentId)
  const newIds = departmentIds.filter((id: string) => !existingIds.includes(id))

  await prisma.contractDepartment.createMany({
    data: newIds.map((departmentId: string) => ({
      contractId: params.id,
      departmentId,
    }))
  })

  for (const departmentId of newIds) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } })
    await prisma.activityLog.create({
      data: {
        contractId: params.id,
        userId: user.id,
        action: 'department.assigned',
        metadata: { departmentId, departmentName: dept?.name }
      }
    })
  }

  return NextResponse.json({ data: { ok: true } })
}