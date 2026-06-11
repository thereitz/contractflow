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