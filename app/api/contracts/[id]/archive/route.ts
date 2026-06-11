import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/contracts/[id]/archive — перевести договор в архив
// Доступ: LAWYER, ADMIN, SUPER_ADMIN
// Условие: договор должен быть в статусе SIGNED
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'LAWYER']
  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
  })

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  if (contract.status !== 'SIGNED') {
    return NextResponse.json(
      { error: 'Архивировать можно только подписанный договор (статус SIGNED)' },
      { status: 400 }
    )
  }

  const [updated] = await prisma.$transaction([
    prisma.contract.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    }),
    prisma.activityLog.create({
      data: {
        contractId: params.id,
        userId: user.id,
        action: 'contract.status_changed',
        metadata: { from: 'SIGNED', to: 'ARCHIVED' },
      },
    }),
  ])

  return NextResponse.json({ data: updated })
}
