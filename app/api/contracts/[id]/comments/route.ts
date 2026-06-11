export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Текст обязателен' }, { status: 400 })

  const contract = await prisma.contract.findUnique({ where: { id: params.id } })
  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const comment = await prisma.comment.create({
    data: { contractId: params.id, authorId: user.id, text }
  })

  await prisma.activityLog.create({
    data: {
      contractId: params.id,
      userId: user.id,
      action: 'comment.added',
      metadata: { commentId: comment.id }
    }
  })

  if (contract.initiatorId !== user.id) {
    await createNotification(
      contract.initiatorId,
      'Новый комментарий',
      `${user.name} оставил комментарий к договору "${contract.title}".`,
      `/contracts/${params.id}`,
      { contractId: params.id, commentId: comment.id }
    )
  }

  return NextResponse.json({ data: comment }, { status: 201 })
}