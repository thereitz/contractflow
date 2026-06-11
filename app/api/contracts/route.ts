export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('search')?.trim() || ''

  const baseWhere = ['HEAD', 'EMPLOYEE'].includes(user.role) && user.departmentId
    ? {
        contractDepartments: {
          some: { departmentId: user.departmentId }
        }
      }
    : {}

  const where = search
    ? {
        AND: [
          baseWhere,
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { counterparty: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        ],
      }
    : baseWhere

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      initiator: { select: { name: true } },
      _count: { select: { contractDepartments: true } }
    }
  })
  return NextResponse.json({ data: contracts })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['LAWYER', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, counterparty, object, amount } = await req.json()
  if (!title || !counterparty) {
    return NextResponse.json({ error: 'Название и контрагент обязательны' }, { status: 400 })
  }

  const contract = await prisma.contract.create({
    data: {
      title,
      counterparty,
      object: object || null,
      amount: amount || null,
      initiatorId: user.id,
    }
  })

  await prisma.activityLog.create({
    data: {
      contractId: contract.id,
      userId: user.id,
      action: 'contract.created',
      metadata: { title, counterparty }
    }
  })

  return NextResponse.json({ data: contract }, { status: 201 })
}