export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    include: { department: true },
  })
  return NextResponse.json({ data: users.map(u => ({ ...u, passwordHash: undefined })) })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, name, role, departmentId, password } = await req.json()
  if (!email || !name || !role || !password) {
    return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const newUser = await prisma.user.create({
    data: { email, name, role, departmentId: departmentId || null, passwordHash },
    include: { department: true },
  })
  return NextResponse.json({ data: { ...newUser, passwordHash: undefined } }, { status: 201 })
}