export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { passwordHash: _, ...safeUser } = user
  return NextResponse.json({ data: safeUser })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, email, password } = await req.json()
  if (!name || !email) {
    return NextResponse.json({ error: 'Имя и email обязательны' }, { status: 400 })
  }

  try {
    const data: { name: string; email: string; passwordHash?: string } = { name, email }
    if (password && password.trim()) {
      data.passwordHash = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      include: { department: true },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'user.profile_updated',
        metadata: { name: updatedUser.name, email: updatedUser.email },
      },
    })

    const { passwordHash: _, ...safeUser } = updatedUser
    return NextResponse.json({ data: safeUser })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email уже занят' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Не удалось обновить профиль' }, { status: 500 })
  }
}