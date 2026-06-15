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
        OR: [
          { initiatorId: user.id },
          {
            contractDepartments: {
              some: { departmentId: user.departmentId }
            }
          }
        ]
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
      initiator: { select: { id: true, name: true, role: true } },
      _count: { select: { contractDepartments: true } }
    }
  })
  return NextResponse.json({ data: contracts })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, counterparty, object, amount } = await req.json()
  if (!counterparty) {
    return NextResponse.json({ error: 'Контрагент обязателен' }, { status: 400 })
  }

  if (!['LAWYER', 'SUPER_ADMIN'].includes(user.role) && title) {
    return NextResponse.json({ error: 'Только юрист может указывать название договора' }, { status: 403 })
  }

  if (['LAWYER', 'SUPER_ADMIN'].includes(user.role) && !title) {
    return NextResponse.json({ error: 'Название договора обязательно для юриста' }, { status: 400 })
  }

  const actualTitle = title || `Запрос: ${counterparty}`
  const contract = await prisma.contract.create({
    data: {
      title: actualTitle,
      counterparty,
      object: object || null,
      amount: amount || null,
      status: 'DRAFT',
      initiatorId: user.id,
    }
  })

  await prisma.activityLog.create({
    data: {
      contractId: contract.id,
      userId: user.id,
      action: 'contract.created',
      metadata: { title: contract.title, counterparty: contract.counterparty },
    }
  })

  return NextResponse.json({ data: contract }, { status: 201 })
}