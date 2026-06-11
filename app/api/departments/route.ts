export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true } } }
  })
  return NextResponse.json({ data: departments })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })

  const department = await prisma.department.create({ data: { name } })
  return NextResponse.json({ data: department }, { status: 201 })
}