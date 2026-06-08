import { cookies } from 'next/headers'
import { prisma } from './prisma'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  try {
    const payload = jwt.verify(token, SECRET) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { department: true },
    })
    return user
  } catch {
    return null
  }
}

export function createToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' })
}