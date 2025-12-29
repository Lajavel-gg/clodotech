import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { createLivreSchema, validate } from '@/lib/validation'
import { z } from 'zod'

// Schema pour les query params
const querySchema = z.object({
  status: z.enum(['to_read', 'reading', 'completed']).optional(),
  wishlist: z.enum(['true', 'false']).optional()
})

// GET - Recuperer tous les livres de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const wishlist = searchParams.get('wishlist')

    // Valider les query params
    const queryValidation = querySchema.safeParse({ status, wishlist })

    const where: Record<string, unknown> = { userId: session.user.id }

    if (queryValidation.success) {
      if (queryValidation.data.status) {
        where.status = queryValidation.data.status
      }
      if (queryValidation.data.wishlist === 'true') {
        where.wishlist = true
      }
    }

    const livres = await prisma.livre.findMany({
      where,
      orderBy: { dateAjout: 'desc' }
    })

    return NextResponse.json(livres)
  } catch (error) {
    console.error('Erreur GET livres:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Ajouter un livre
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()

    // Validation avec Zod
    const validation = validate(createLivreSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const data = validation.data

    // Verifier si le livre existe deja pour cet utilisateur
    const existing = await prisma.livre.findUnique({
      where: {
        userId_isbn: {
          userId: session.user.id,
          isbn: data.isbn
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Ce livre est deja dans votre bibliotheque' }, { status: 400 })
    }

    const livre = await prisma.livre.create({
      data: {
        isbn: data.isbn,
        titre: data.titre,
        sousTitre: data.sousTitre || null,
        auteur: data.auteur,
        dateSortie: data.dateSortie || null,
        editeur: data.editeur || null,
        categorie: data.categorie || null,
        description: data.description || null,
        image: data.image || null,
        pages: data.pages,
        userId: session.user.id,
        status: data.status,
        wishlist: data.wishlist
      }
    })

    return NextResponse.json(livre, { status: 201 })
  } catch (error) {
    console.error('Erreur POST livre:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
