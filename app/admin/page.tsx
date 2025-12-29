'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdminStats {
  users: {
    total: number
    admins: number
    newThisWeek: number
  }
  livres: {
    total: number
    to_read: number
    reading: number
    completed: number
    wishlist: number
    newThisWeek: number
  }
  notifications: {
    unread: number
  }
  followedAuthors: number
  topUsers: Array<{
    id: string
    name: string
    livresCount: number
  }>
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  _count: {
    livres: number
    notifications: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Password reset modal
  const [resetModal, setResetModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user || session.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users')
      ])

      if (!statsRes.ok || !usersRes.ok) {
        throw new Error('Erreur lors du chargement')
      }

      const [statsData, usersData] = await Promise.all([
        statsRes.json(),
        usersRes.json()
      ])

      setStats(statsData)
      setUsers(usersData)
    } catch (err) {
      setError('Erreur lors du chargement des donnees')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erreur')
        return
      }

      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ))
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la modification')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur et tous ses livres ?')) return

    setDeletingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erreur')
        return
      }

      setUsers(users.filter(u => u.id !== userId))
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const resetPassword = async () => {
    if (!resetModal.user || !newPassword) return

    if (newPassword.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caracteres')
      return
    }

    setResetting(true)
    try {
      const res = await fetch(`/api/admin/users/${resetModal.user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Erreur')
        return
      }

      alert(`Mot de passe reinitialise pour ${resetModal.user.email}`)
      setResetModal({ open: false, user: null })
      setNewPassword('')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la reinitialisation')
    } finally {
      setResetting(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 mx-auto mb-4" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary">Reessayer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour
            </Link>
            <div className="h-6 w-px" style={{ background: 'var(--border)' }} />
            <h1 className="text-xl font-bold text-white">Administration</h1>
          </div>
          <span className="badge">Admin: {session?.user?.name || session?.user?.email}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Utilisateurs</p>
              <p className="text-2xl font-bold text-white">{stats.users.total}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                +{stats.users.newThisWeek} cette semaine
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Admins</p>
              <p className="text-2xl font-bold text-white">{stats.users.admins}</p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Livres</p>
              <p className="text-2xl font-bold text-white">{stats.livres.total}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                +{stats.livres.newThisWeek} cette semaine
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Auteurs suivis</p>
              <p className="text-2xl font-bold text-white">{stats.followedAuthors}</p>
            </div>
          </div>
        )}

        {/* Livres Stats */}
        {stats && (
          <div className="mb-8 p-6 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Statistiques Livres</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                <p className="text-2xl font-bold" style={{ color: '#6366f1' }}>{stats.livres.to_read}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>A lire</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats.livres.reading}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>En cours</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.livres.completed}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Termines</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{stats.livres.wishlist}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Wishlist</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Users */}
        {stats && stats.topUsers.length > 0 && (
          <div className="mb-8 p-6 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Top Lecteurs</h2>
            <div className="space-y-2">
              {stats.topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: index === 0 ? '#f59e0b' : 'var(--border)', color: index === 0 ? 'black' : 'var(--text-muted)' }}>
                    {index + 1}
                  </span>
                  <span className="flex-1 text-white">{user.name}</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.livresCount} livres</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="p-6 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Gestion des Utilisateurs</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Utilisateur</th>
                  <th className="text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Role</th>
                  <th className="text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Livres</th>
                  <th className="text-left py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Inscrit le</th>
                  <th className="text-right py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-white font-medium">{user.name || 'Sans nom'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={user.id === session?.user?.id}
                        className="px-2 py-1 rounded text-xs font-medium transition-all"
                        style={{
                          background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                          color: user.role === 'admin' ? '#ef4444' : '#6366f1',
                          cursor: user.id === session?.user?.id ? 'not-allowed' : 'pointer',
                          opacity: user.id === session?.user?.id ? 0.5 : 1
                        }}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-white">{user._count.livres}</td>
                    <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password */}
                        <button
                          onClick={() => setResetModal({ open: true, user })}
                          className="p-1.5 rounded-lg transition-all hover:bg-[var(--bg-hover)]"
                          style={{ color: '#f59e0b' }}
                          title="Reinitialiser le mot de passe"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={user.id === session?.user?.id || deletingId === user.id}
                          className="p-1.5 rounded-lg transition-all hover:bg-red-500/20"
                          style={{
                            color: '#ef4444',
                            cursor: user.id === session?.user?.id ? 'not-allowed' : 'pointer',
                            opacity: user.id === session?.user?.id ? 0.3 : 1
                          }}
                          title={user.id === session?.user?.id ? 'Vous ne pouvez pas vous supprimer' : 'Supprimer'}
                        >
                          {deletingId === user.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Password Reset Modal */}
      {resetModal.open && resetModal.user && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setResetModal({ open: false, user: null })} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-xl p-6 animate-fade-in"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-2">Reinitialiser le mot de passe</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {resetModal.user.name || resetModal.user.email}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Nouveau mot de passe
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 caracteres"
                      className="input-dark flex-1"
                    />
                    <button
                      onClick={generatePassword}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      title="Generer un mot de passe"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setResetModal({ open: false, user: null })
                      setNewPassword('')
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={resetPassword}
                    disabled={resetting || newPassword.length < 8}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                    style={{ opacity: newPassword.length < 8 ? 0.5 : 1 }}
                  >
                    {resetting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Reinitialisation...
                      </>
                    ) : (
                      'Reinitialiser'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
