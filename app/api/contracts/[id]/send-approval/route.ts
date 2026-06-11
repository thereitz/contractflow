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

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { contractDepartments: true }
  })

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.contract.update({
    where: { id: params.id },
    data: { status: 'APPROVAL' }
  })

  await prisma.activityLog.create({
    data: {
      contractId: params.id,
      userId: user.id,
      action: 'contract.status_changed',
      metadata: { from: contract.status, to: 'APPROVAL' }
    }
  })

  return NextResponse.json({ data: { ok: true } })
}