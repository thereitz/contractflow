export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      initiator: { select: { id: true, name: true } },
      files: { orderBy: { version: 'desc' } },
      contractDepartments: {
        include: { department: true }
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { name: true, role: true } } }
      },
      approvals: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { name: true } } }
      }
    }
  })

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: contract })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['LAWYER', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contract = await prisma.contract.findUnique({ where: { id: params.id } })
  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { title, counterparty, object, amount } = await req.json()
  if (!title || !counterparty) {
    return NextResponse.json({ error: 'Название и контрагент обязательны' }, { status: 400 })
  }

  const updated = await prisma.contract.update({
    where: { id: params.id },
    data: {
      title,
      counterparty,
      object: object || null,
      amount: amount || null,
    },
  })

  await prisma.activityLog.create({
    data: {
      contractId: params.id,
      userId: user.id,
      action: 'contract.updated',
      metadata: { title, counterparty },
    },
  })

  return NextResponse.json({ data: updated })
}
