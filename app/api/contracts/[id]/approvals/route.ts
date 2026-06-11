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
  if (!['HEAD', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, comment } = await req.json()
  if (!['APPROVED', 'RETURNED'].includes(action)) {
    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 })
  }

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      files: { orderBy: { version: 'desc' }, take: 1 },
      contractDepartments: {
        include: { department: { include: { users: { where: { role: 'HEAD' } } } } }
      }
    }
  })

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const currentVersion = contract.files[0]?.version ?? 0

  await prisma.approval.create({
    data: {
      contractId: params.id,
      userId: user.id,
      action,
      fileVersion: currentVersion,
      comment: comment || null,
    }
  })

  await prisma.activityLog.create({
    data: {
      contractId: params.id,
      userId: user.id,
      action: action === 'APPROVED' ? 'approval.approved' : 'approval.returned',
      metadata: { fileVersion: currentVersion, comment }
    }
  })

  if (action === 'RETURNED') {
    await prisma.contract.update({
      where: { id: params.id },
      data: { status: 'COLLECTING' }
    })
    await prisma.activityLog.create({
      data: {
        contractId: params.id,
        userId: user.id,
        action: 'contract.status_changed',
        metadata: { from: 'APPROVAL', to: 'COLLECTING' }
      }
    })
  } else {
    // Проверяем все ли согласовали
    const approvals = await prisma.approval.findMany({
      where: { contractId: params.id, action: 'APPROVED', fileVersion: currentVersion }
    })
    const approvedUserIds = approvals.map(a => a.userId)

    const allHeads = contract.contractDepartments
      .flatMap(cd => cd.department.users)
      .map(u => u.id)

    const allApproved = allHeads.every(headId => approvedUserIds.includes(headId))

    if (allApproved && allHeads.length > 0) {
      await prisma.contract.update({
        where: { id: params.id },
        data: { status: 'SIGNED' }
      })
      await prisma.activityLog.create({
        data: {
          contractId: params.id,
          userId: user.id,
          action: 'contract.status_changed',
          metadata: { from: 'APPROVAL', to: 'SIGNED' }
        }
      })
    }
  }

  return NextResponse.json({ data: { ok: true } })
}