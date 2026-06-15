export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, role, departmentId, password } = await req.json()
  if (!name || !email || !role) {
    return NextResponse.json({ error: 'Имя, email и роль обязательны' }, { status: 400 })
  }

  const data: Record<string, unknown> = { name, email, role, departmentId: departmentId || null }
  if (password?.trim()) {
    data.passwordHash = await bcrypt.hash(password, 10)
  }

  try {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      include: { department: true },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'user.updated',
        metadata: { targetUserId: params.id, name, email, role },
      },
    })

    const { passwordHash: _, ...safe } = updated
    return NextResponse.json({ data: safe })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Email уже занят' }, { status: 400 })
    return NextResponse.json({ error: 'Не удалось обновить пользователя' }, { status: 500 })
  }
}
