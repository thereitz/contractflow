export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })

  try {
    const updated = await prisma.department.update({
      where: { id: params.id },
      data: { name: name.trim() },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'department.updated',
        metadata: { departmentId: params.id, name },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Отдел с таким названием уже существует' }, { status: 400 })
    return NextResponse.json({ error: 'Не удалось обновить отдел' }, { status: 500 })
  }
}
