export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createNotifications } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['LAWYER', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      contractDepartments: {
        include: { department: { include: { users: { where: { role: 'HEAD' } } } } }
      }
    }
  })

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (contract.contractDepartments.length === 0) {
    return NextResponse.json({ error: 'Назначьте отделы перед отправкой' }, { status: 400 })
  }

  await prisma.contract.update({
    where: { id: params.id },
    data: { status: 'COLLECTING' }
  })

  await prisma.activityLog.create({
    data: {
      contractId: params.id,
      userId: user.id,
      action: 'contract.status_changed',
      metadata: { from: contract.status, to: 'COLLECTING' }
    }
  })

  const inputHeadIds = contract.contractDepartments.flatMap(cd => cd.department.users.map(u => u.id))
  const headIds: string[] = []
  for (const id of inputHeadIds) {
    if (!headIds.includes(id)) {
      headIds.push(id)
    }
  }

  if (headIds.length > 0) {
    await createNotifications(
      headIds,
      'Договор отправлен на сбор информации',
      `Договор "${contract.title}" переведён в статус Сбор информации.`,
      `/contracts/${params.id}`,
      { contractId: params.id }
    )
  }

  return NextResponse.json({ data: { ok: true } })
}