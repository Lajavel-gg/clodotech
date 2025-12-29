import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { updateLivreSchema, idParamSchema, validate } from '@/lib/validation'

type Params = Promise<{ id: string }>

// GET - Recuperer un livre par ID
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params

    // Valider l'ID
    const idValidation = validate(idParamSchema, { id })
    if (!idValidation.success) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const livre = await prisma.livre.findFirst({
      where: {
        id: idValidation.data.id,
        userId: session.user.id
      }
    })

    if (!livre) {
      return NextResponse.json({ error: 'Livre non trouve' }, { status: 404 })
    }

    return NextResponse.json(livre)
  } catch (error) {
    console.error('Erreur GET livre:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier un livre
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params

    // Valider l'ID
    const idValidation = validate(idParamSchema, { id })
    if (!idValidation.success) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const body = await request.json()

    // Valider les donnees de mise a jour
    const dataValidation = validate(updateLivreSchema, body)
    if (!dataValidation.success) {
      return NextResponse.json({ error: dataValidation.error }, { status: 400 })
    }

    const data = dataValidation.data

    // Verifier que le livre appartient a l'utilisateur
    const existing = await prisma.livre.findFirst({
      where: {
        id: idValidation.data.id,
        userId: session.user.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Livre non trouve' }, { status: 404 })
    }

    // Construire l'objet de mise a jour seulement avec les champs fournis
    const updateData: Record<string, unknown> = {}

    if (data.titre !== undefined) updateData.titre = data.titre
    if (data.sousTitre !== undefined) updateData.sousTitre = data.sousTitre
    if (data.auteur !== undefined) updateData.auteur = data.auteur
    if (data.editeur !== undefined) updateData.editeur = data.editeur
    if (data.pages !== undefined) updateData.pages = data.pages
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.rating !== undefined) updateData.rating = data.rating
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.wishlist !== undefined) updateData.wishlist = data.wishlist
    if (data.currentPage !== undefined) updateData.currentPage = data.currentPage
    if (data.chapitres !== undefined) updateData.chapitres = data.chapitres

    // Gerer les dates
    if (data.startedAt !== undefined) {
      updateData.startedAt = data.startedAt ? new Date(data.startedAt) : null
    }
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null
    }

    const livre = await prisma.livre.update({
      where: { id: idValidation.data.id },
      data: updateData
    })

    return NextResponse.json(livre)
  } catch (error) {
    console.error('Erreur PUT livre:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un livre
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params

    // Valider l'ID
    const idValidation = validate(idParamSchema, { id })
    if (!idValidation.success) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    // Verifier que le livre appartient a l'utilisateur
    const existing = await prisma.livre.findFirst({
      where: {
        id: idValidation.data.id,
        userId: session.user.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Livre non trouve' }, { status: 404 })
    }

    await prisma.livre.delete({
      where: { id: idValidation.data.id }
    })

    return NextResponse.json({ message: 'Livre supprime' })
  } catch (error) {
    console.error('Erreur DELETE livre:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
