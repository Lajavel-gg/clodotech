import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

// GET - Statistiques globales du site (admin only)
export async function GET() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return adminCheck.response
  }

  try {
    // Compter les utilisateurs
    const totalUsers = await prisma.user.count()
    const adminCount = await prisma.user.count({ where: { role: 'admin' } })

    // Compter les livres
    const totalLivres = await prisma.livre.count()
    const livresByStatus = await prisma.livre.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    // Statistiques des livres par statut
    const statusStats = {
      to_read: 0,
      reading: 0,
      completed: 0
    }
    livresByStatus.forEach(stat => {
      if (stat.status in statusStats) {
        statusStats[stat.status as keyof typeof statusStats] = stat._count.id
      }
    })

    // Compter les livres avec wishlist
    const wishlistCount = await prisma.livre.count({ where: { wishlist: true } })

    // Compter les notifications non lues
    const unreadNotifications = await prisma.notification.count({ where: { read: false } })

    // Compter les auteurs suivis
    const followedAuthors = await prisma.followedAuthor.count()

    // Utilisateurs les plus actifs (top 5)
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { livres: true }
        }
      },
      orderBy: {
        livres: { _count: 'desc' }
      },
      take: 5
    })

    // Utilisateurs recemment inscrits (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const newUsersThisWeek = await prisma.user.count({
      where: {
        createdAt: { gte: oneWeekAgo }
      }
    })

    // Livres ajoutes cette semaine
    const newLivresThisWeek = await prisma.livre.count({
      where: {
        dateAjout: { gte: oneWeekAgo }
      }
    })

    return NextResponse.json({
      users: {
        total: totalUsers,
        admins: adminCount,
        newThisWeek: newUsersThisWeek
      },
      livres: {
        total: totalLivres,
        ...statusStats,
        wishlist: wishlistCount,
        newThisWeek: newLivresThisWeek
      },
      notifications: {
        unread: unreadNotifications
      },
      followedAuthors,
      topUsers: topUsers.map(u => ({
        id: u.id,
        name: u.name || u.email,
        livresCount: u._count.livres
      }))
    })
  } catch (error) {
    console.error('Erreur GET admin stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
