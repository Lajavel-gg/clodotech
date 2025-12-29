import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { z } from 'zod'

type Params = Promise<{ id: string }>

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  name: z.string().max(100).optional()
})

// GET - Obtenir les details d'un utilisateur
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response
  }

  const { id } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            livres: true,
            notifications: true,
            followedAuthors: true
          }
        },
        livres: {
          select: {
            id: true,
            titre: true,
            auteur: true,
            status: true,
            dateAjout: true
          },
          orderBy: { dateAjout: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur GET user:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier un utilisateur (role, name)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response
  }

  const { id } = await params

  try {
    const body = await request.json()
    const validation = updateUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map(e => e.message).join(', ') },
        { status: 400 }
      )
    }

    // Empecher un admin de se retirer ses propres droits admin
    if (validation.data.role === 'user' && id === adminCheck.session?.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas retirer vos propres droits admin' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id },
      data: validation.data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erreur PUT user:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response
  }

  const { id } = await params

  try {
    // Empecher un admin de se supprimer lui-meme
    if (id === adminCheck.session?.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    // Verifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 })
    }

    // Supprimer l'utilisateur (cascade supprimera livres, notifications, etc.)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Utilisateur supprime' })
  } catch (error) {
    console.error('Erreur DELETE user:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
