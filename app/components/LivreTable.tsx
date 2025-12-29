'use client'

import { useState } from 'react'
import { Livre } from '../types'
import Image from 'next/image'

interface LivreTableProps {
  livres: Livre[]
  onView: (livre: Livre) => void
  onRefresh: () => void
}

const statusConfig = {
  to_read: { label: 'A lire', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  reading: { label: 'En cours', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  completed: { label: 'Lu', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }
}

export default function LivreTable({ livres, onView, onRefresh }: LivreTableProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const updateStatus = async (livre: Livre, newStatus: string) => {
    setUpdatingId(livre.id)
    try {
      await fetch(`/api/livres/${livre.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...livre, status: newStatus })
      })
      onRefresh()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleWishlist = async (livre: Livre) => {
    setUpdatingId(livre.id)
    try {
      await fetch(`/api/livres/${livre.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...livre, wishlist: !livre.wishlist })
      })
      onRefresh()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  if (livres.length === 0) {
    return (
      <div className="text-center py-16">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="font-medium text-lg text-white">Aucun livre</p>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Scannez un ISBN pour ajouter votre premier livre</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {livres.map((livre, index) => (
        <div
          key={livre.id}
          className="flex items-center gap-4 p-4 rounded-xl transition-all animate-fade-in hover:scale-[1.01] cursor-pointer"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            animationDelay: `${index * 50}ms`
          }}
          onClick={() => onView(livre)}
        >
          {/* Cover */}
          <div
            className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0"
            style={{ background: 'var(--bg-secondary)' }}
          >
            {livre.image ? (
              <Image
                src={livre.image}
                alt={livre.titre}
                width={56}
                height={80}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div className="cursor-pointer" onClick={() => onView(livre)}>
                <h4 className="font-medium text-white truncate hover:text-[var(--accent)]">{livre.titre}</h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{livre.auteur}</p>
              </div>

              {/* Wishlist */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleWishlist(livre)
                }}
                disabled={updatingId === livre.id}
                className="p-1.5 rounded-lg transition-all hover:scale-110"
                style={{ color: livre.wishlist ? '#ef4444' : 'var(--text-muted)' }}
              >
                <svg className="w-5 h-5" fill={livre.wishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Status Selector */}
              <div className="flex gap-1">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation()
                      updateStatus(livre, key)
                    }}
                    disabled={updatingId === livre.id}
                    className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: livre.status === key ? config.bg : 'transparent',
                      color: livre.status === key ? config.color : 'var(--text-muted)',
                      border: `1px solid ${livre.status === key ? config.color : 'var(--border)'}`
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={async (e) => {
                      e.stopPropagation()
                      setUpdatingId(livre.id)
                      try {
                        await fetch(`/api/livres/${livre.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...livre, rating: star })
                        })
                        onRefresh()
                      } catch (error) {
                        console.error('Erreur:', error)
                      } finally {
                        setUpdatingId(null)
                      }
                    }}
                    disabled={updatingId === livre.id}
                    className="p-0.5 transition-transform hover:scale-125"
                  >
                    <svg
                      className="w-4 h-4"
                      fill={(livre.rating || 0) >= star ? '#f59e0b' : 'none'}
                      stroke={(livre.rating || 0) >= star ? '#f59e0b' : 'var(--text-muted)'}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Category badge */}
              {livre.categorie && (
                <span className="badge text-xs">{livre.categorie}</span>
              )}

              {/* Pages */}
              {livre.pages && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {livre.pages} pages
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
