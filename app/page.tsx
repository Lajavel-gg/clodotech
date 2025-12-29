'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import ScanBar from './components/ScanBar'
import LivreTable from './components/LivreTable'
import BookDetailModal from './components/BookDetailModal'
import NotificationBell from './components/NotificationBell'
import { Livre, UserStats } from './types'

type StatusFilter = 'all' | 'to_read' | 'reading' | 'completed' | 'wishlist'

export default function Home() {
  const { data: session } = useSession()
  const [livres, setLivres] = useState<Livre[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLivre, setSelectedLivre] = useState<Livre | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const fetchLivres = async () => {
    try {
      let url = '/api/livres'
      if (statusFilter === 'wishlist') {
        url += '?wishlist=true'
      } else if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`
      }

      const res = await fetch(url)
      const data = await res.json()
      setLivres(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur:', error)
      setLivres([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/livres/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  useEffect(() => {
    fetchLivres()
    fetchStats()
  }, [statusFilter])

  const handleViewDetail = (livre: Livre) => {
    setSelectedLivre(livre)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedLivre(null)
  }

  const handleRefresh = () => {
    fetchLivres()
    fetchStats()
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const filters: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'Tous', count: stats?.totalLivres },
    { key: 'to_read', label: 'A lire', count: stats?.toRead },
    { key: 'reading', label: 'En cours', count: stats?.reading },
    { key: 'completed', label: 'Lus', count: stats?.completed },
    { key: 'wishlist', label: 'Wishlist', count: stats?.wishlist },
  ]

  // Filter books by search query (title or author)
  const filteredLivres = livres.filter((livre) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      livre.titre.toLowerCase().includes(query) ||
      livre.auteur.toLowerCase().includes(query) ||
      (livre.categorie && livre.categorie.toLowerCase().includes(query))
    )
  })

  const statCards = [
    {
      label: 'Total Livres',
      value: stats?.totalLivres || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: '#6366f1'
    },
    {
      label: 'En cours',
      value: stats?.reading || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#f59e0b'
    },
    {
      label: 'Termines',
      value: stats?.completed || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#22c55e'
    },
    {
      label: 'Pages lues',
      value: stats?.totalPages?.toLocaleString() || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: '#ec4899'
    },
  ]

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
             style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="glass sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-semibold text-white">Clodotech</h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Library Manager</p>
                </div>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-xl mx-8">
                <ScanBar onBookAdded={handleRefresh} />
              </div>

              {/* User */}
              <div className="flex items-center gap-3">
                <NotificationBell />

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                         style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white' }}>
                      {userInitial}
                    </div>
                    <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-1 animate-fade-in"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <p className="text-sm font-medium text-white">{userName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{session?.user?.email}</p>
                        {session?.user?.role === 'admin' && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            Admin
                          </span>
                        )}
                      </div>
                      {session?.user?.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                          style={{ color: 'var(--text-primary)' }}
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Administration
                          </span>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                        style={{ color: 'var(--error)' }}
                      >
                        Se deconnecter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-1">Bonjour, {userName}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Gerez votre bibliotheque personnelle</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <div
                key={stat.label}
                className="card-hover rounded-xl p-5 animate-fade-in"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className="p-2.5 rounded-lg" style={{ background: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Section */}
          <div
            className="rounded-xl overflow-hidden animate-fade-in"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              animationDelay: '400ms'
            }}
          >
            {/* Table Header with Filters */}
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold text-white">Ma Bibliotheque</h3>

                {/* Search input */}
                <div className="relative" style={{ width: '280px', minWidth: '200px' }}>
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--text-muted)', zIndex: 1 }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un livre..."
                    className="w-full text-sm rounded-lg outline-none transition-all"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      padding: '0.5rem 2.5rem 0.5rem 2.5rem'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-hover)]"
                      style={{ color: 'var(--text-muted)', zIndex: 1 }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      statusFilter === filter.key
                        ? 'text-white'
                        : ''
                    }`}
                    style={{
                      background: statusFilter === filter.key ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: statusFilter === filter.key ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    {filter.label}
                    {filter.count !== undefined && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs"
                            style={{
                              background: statusFilter === filter.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-hover)'
                            }}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Content */}
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-16 rounded skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded skeleton" />
                        <div className="h-3 w-1/4 rounded skeleton" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <LivreTable livres={filteredLivres} onView={handleViewDetail} onRefresh={handleRefresh} />
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Fait avec Claude Code
            </p>
          </footer>
        </main>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}

      {/* Book Detail Modal */}
      <BookDetailModal
        livre={selectedLivre}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onUpdate={handleRefresh}
        onDelete={handleRefresh}
      />
    </div>
  )
}
