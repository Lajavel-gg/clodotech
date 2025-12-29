import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

// GET - Liste tous les utilisateurs (admin only)
export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            livres: true,
            notifications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Erreur GET users:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
