import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const userId = session.user.id

    // Get all books for this user
    const livres = await prisma.livre.findMany({
      where: { userId }
    })

    // Calculate stats
    const totalLivres = livres.length
    const totalPages = livres.reduce((acc, l) => acc + (l.pages || 0), 0)
    const uniqueAuthors = new Set(livres.map(l => l.auteur)).size
    const uniqueCategories = new Set(livres.map(l => l.categorie).filter(Boolean)).size

    // Status counts
    const toRead = livres.filter(l => l.status === 'to_read').length
    const reading = livres.filter(l => l.status === 'reading').length
    const completed = livres.filter(l => l.status === 'completed').length
    const wishlist = livres.filter(l => l.wishlist).length

    // Average rating for completed books
    const ratedBooks = livres.filter(l => l.rating !== null)
    const averageRating = ratedBooks.length > 0
      ? ratedBooks.reduce((acc, l) => acc + (l.rating || 0), 0) / ratedBooks.length
      : 0

    return NextResponse.json({
      totalLivres,
      totalPages,
      uniqueAuthors,
      uniqueCategories,
      toRead,
      reading,
      completed,
      wishlist,
      averageRating: Math.round(averageRating * 10) / 10
    })
  } catch (error) {
    console.error('Erreur GET stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
