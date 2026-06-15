export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status, submission } = body

  const cd = await prisma.contractDepartment.findUnique({
    where: { contractId_departmentId: { contractId: params.id, departmentId: params.deptId } }
  })
  if (!cd) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Сохранение формы отдела (без смены статуса)
  if (submission !== undefined && status === undefined) {
    const canSubmit =
      user.role === 'SUPER_ADMIN' ||
      (['HEAD', 'EMPLOYEE'].includes(user.role) && user.departmentId === params.deptId)
    if (!canSubmit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const nextStatus = cd.status === 'PENDING' ? 'IN_PROGRESS' : cd.status
    const updated = await prisma.contractDepartment.update({
      where: { contractId_departmentId: { contractId: params.id, departmentId: params.deptId } },
      data: { submission, status: nextStatus },
    })

    if (cd.status === 'PENDING') {
      await prisma.activityLog.create({
        data: {
          contractId: params.id,
          userId: user.id,
          action: 'department.status_changed',
          metadata: { departmentId: params.deptId, from: 'PENDING', to: 'IN_PROGRESS' },
        },
      })
    }

    return NextResponse.json({ data: updated })
  }

  // Смена статуса (Подтвердить сдачу)
  const updated = await prisma.contractDepartment.update({
    where: { contractId_departmentId: { contractId: params.id, departmentId: params.deptId } },
    data: { status }
  })

  await prisma.activityLog.create({
    data: {
      contractId: params.id,
      userId: user.id,
      action: 'department.status_changed',
      metadata: { departmentId: params.deptId, from: cd.status, to: status }
    }
  })

  if (status === 'SUBMITTED') {
    const allDepts = await prisma.contractDepartment.findMany({
      where: { contractId: params.id }
    })
    const allSubmitted = allDepts.every(d =>
      d.status === 'SUBMITTED' || d.departmentId === params.deptId
    )
    if (allSubmitted) {
      await prisma.contract.update({
        where: { id: params.id },
        data: { status: 'REVIEWING' }
      })
      await prisma.activityLog.create({
        data: {
          contractId: params.id,
          userId: user.id,
          action: 'contract.status_changed',
          metadata: { from: 'COLLECTING', to: 'REVIEWING' }
        }
      })
    }
  }

  return NextResponse.json({ data: updated })
}
