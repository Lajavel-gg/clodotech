'use client'

import { useState, useEffect } from 'react'
import { Livre } from '../types'

interface BookDetailModalProps {
  livre: Livre | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  onDelete: () => void
}

const statusConfig = {
  to_read: { label: 'A lire', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  reading: { label: 'En cours', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  completed: { label: 'Termine', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }
}

export default function BookDetailModal({ livre, isOpen, onClose, onUpdate, onDelete }: BookDetailModalProps) {
  const [currentPage, setCurrentPage] = useState<string>('')
  const [chapitres, setChapitres] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [localLivre, setLocalLivre] = useState<Livre | null>(null)

  useEffect(() => {
    if (livre) {
      setCurrentPage(livre.currentPage?.toString() || '')
      setChapitres(livre.chapitres?.toString() || '')
      setNotes(livre.notes || '')
      setLocalLivre(livre)
    }
  }, [livre])

  const updateField = async (updates: Partial<Livre>) => {
    if (!localLivre) return
    setLoading(true)
    try {
      const newData = { ...localLivre, ...updates }
      await fetch(`/api/livres/${localLivre.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      })
      setLocalLivre(newData as Livre)
      onUpdate()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!localLivre) return
    const updates: Partial<Livre> = { status: newStatus as Livre['status'] }

    if (newStatus === 'reading' && !localLivre.startedAt) {
      updates.startedAt = new Date().toISOString()
    }
    if (newStatus === 'completed' && !localLivre.completedAt) {
      updates.completedAt = new Date().toISOString()
      if (localLivre.pages) {
        updates.currentPage = localLivre.pages
        setCurrentPage(localLivre.pages.toString())
      }
    }

    await updateField(updates)
  }

  const updateRating = async (rating: number) => {
    await updateField({ rating })
  }

  const toggleWishlist = async () => {
    if (!localLivre) return
    await updateField({ wishlist: !localLivre.wishlist })
  }

  const saveNotes = async () => {
    await updateField({
      currentPage: currentPage ? parseInt(currentPage) : null,
      chapitres: chapitres ? parseInt(chapitres) : null,
      notes: notes || null
    })
  }

  const handleDelete = async () => {
    if (!localLivre || !confirm('Supprimer ce livre de votre bibliotheque ?')) return
    setLoading(true)
    try {
      await fetch(`/api/livres/${localLivre.id}`, { method: 'DELETE' })
      onDelete()
      onClose()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !localLivre) return null

  const progress = localLivre.pages && localLivre.currentPage
    ? Math.min(Math.round((localLivre.currentPage / localLivre.pages) * 100), 100)
    : 0

  const config = statusConfig[localLivre.status as keyof typeof statusConfig]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl animate-fade-in my-8 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with cover */}
        <div className="relative h-48 rounded-t-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            {localLivre.image ? (
              <div className="w-28 h-40 rounded-lg shadow-2xl overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localLivre.image}
                  alt={localLivre.titre}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="w-28 h-40 rounded-lg shadow-2xl flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                <svg className="w-12 h-12" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full transition-colors hover:bg-black/50"
            style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Wishlist button */}
          <button
            onClick={toggleWishlist}
            disabled={loading}
            className="absolute top-4 left-4 p-2 rounded-full transition-all hover:scale-110"
            style={{ background: 'rgba(0,0,0,0.3)', color: localLivre.wishlist ? '#ef4444' : 'white' }}
          >
            <svg className="w-5 h-5" fill={localLivre.wishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status badge */}
          <div className="flex justify-center mb-4">
            <span
              className="px-4 py-1.5 rounded-full text-sm font-medium"
              style={{ background: config.bg, color: config.color }}
            >
              {config.label}
            </span>
          </div>

          {/* Title and author */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">{localLivre.titre}</h2>
            {localLivre.sousTitre && (
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{localLivre.sousTitre}</p>
            )}
            <p style={{ color: 'var(--text-secondary)' }}>par {localLivre.auteur}</p>
          </div>

          {/* Rating */}
          <div className="flex justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => updateRating(star)}
                disabled={loading}
                className="p-1 transition-transform hover:scale-125 disabled:opacity-50"
              >
                <svg
                  className="w-8 h-8"
                  fill={(localLivre.rating || 0) >= star ? '#f59e0b' : 'none'}
                  stroke={(localLivre.rating || 0) >= star ? '#f59e0b' : 'var(--text-muted)'}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            ))}
          </div>

          {/* Status buttons */}
          <div className="flex justify-center gap-2 mb-6">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => updateStatus(key)}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: localLivre.status === key ? cfg.bg : 'var(--bg-tertiary)',
                  color: localLivre.status === key ? cfg.color : 'var(--text-muted)',
                  border: `1px solid ${localLivre.status === key ? cfg.color : 'var(--border)'}`
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Progress bar (if reading) */}
          {localLivre.status === 'reading' && localLivre.pages && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--text-muted)' }}>Progression</span>
                <span style={{ color: 'var(--text-secondary)' }}>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                />
              </div>
            </div>
          )}

          {/* Book info grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Pages</p>
              <p className="text-lg font-semibold text-white">{localLivre.pages || '-'}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Editeur</p>
              <p className="text-sm font-medium text-white truncate">{localLivre.editeur || '-'}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Date de sortie</p>
              <p className="text-sm font-medium text-white">{localLivre.dateSortie || '-'}</p>
            </div>
            {localLivre.categorie && (
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Categorie</p>
                <span className="badge">{localLivre.categorie}</span>
              </div>
            )}
          </div>

          {/* Bookmark section */}
          <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="font-medium text-white">Marque-page</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Page actuelle</label>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Ex: 125"
                  className="input-dark w-full text-sm"
                  min="0"
                  max={localLivre.pages || undefined}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nb chapitres</label>
                <input
                  type="number"
                  value={chapitres}
                  onChange={(e) => setChapitres(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Ex: 20"
                  className="input-dark w-full text-sm"
                  min="0"
                />
              </div>
            </div>
            {localLivre.pages && currentPage && parseInt(currentPage) > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Il vous reste {Math.max(0, localLivre.pages - parseInt(currentPage))} pages a lire
              </p>
            )}
          </div>

          {/* Description */}
          {localLivre.description && (
            <div className="mb-6">
              <h4 className="font-medium text-white mb-2">Description</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {localLivre.description}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <h4 className="font-medium text-white mb-2">Mes notes</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Ajoutez vos notes personnelles..."
              rows={3}
              className="input-dark w-full resize-none text-sm"
            />
          </div>

          {/* Reading dates */}
          {(localLivre.startedAt || localLivre.completedAt) && (
            <div className="flex gap-4 mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              {localLivre.startedAt && (
                <div>
                  <span>Commence le: </span>
                  <span className="text-white">{new Date(localLivre.startedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {localLivre.completedAt && (
                <div>
                  <span>Termine le: </span>
                  <span className="text-white">{new Date(localLivre.completedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          )}

          {/* ISBN */}
          <div className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            ISBN: {localLivre.isbn}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-tertiary)', borderRadius: '0 0 1rem 1rem' }}
        >
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/10"
            style={{ color: 'var(--error)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
