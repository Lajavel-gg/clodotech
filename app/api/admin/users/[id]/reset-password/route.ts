import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import bcrypt from 'bcryptjs'

type Params = Promise<{ id: string }>

// POST - Reinitialiser le mot de passe d'un utilisateur
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caracteres' },
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

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 14)

    // Mettre a jour le mot de passe
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ message: 'Mot de passe reinitialise avec succes' })
  } catch (error) {
    console.error('Erreur reset password:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
