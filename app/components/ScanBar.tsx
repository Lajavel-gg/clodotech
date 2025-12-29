'use client'

import { useState } from 'react'

interface ScanBarProps {
  onBookAdded: () => void
}

export default function ScanBar({ onBookAdded }: ScanBarProps) {
  const [isbn, setIsbn] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  const scanLivre = async () => {
    if (!isbn.trim()) return

    setLoading(true)
    setStatus({ type: null, message: '' })

    try {
      let gBook: Record<string, string | number> = {}
      try {
        const resG = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
        const dataG = await resG.json()

        if (dataG.totalItems > 0) {
          const info = dataG.items[0].volumeInfo
          gBook = {
            titre: info.title || '',
            sousTitre: info.subtitle || '',
            auteur: info.authors ? info.authors.join(', ') : '',
            dateSortie: info.publishedDate || '',
            editeur: info.publisher || '',
            categorie: info.categories ? info.categories[0] : '',
            description: info.description || '',
            image: info.imageLinks?.thumbnail || '',
            pages: info.pageCount || 0
          }
        }
      } catch (e) {
        console.log('Erreur Google Books:', e)
      }

      let olBook: Record<string, string | number> = {}
      try {
        const resOL = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
        const dataOL = await resOL.json()
        const key = `ISBN:${isbn}`

        if (dataOL[key]) {
          const info = dataOL[key]
          olBook = {
            titre: info.title || '',
            auteur: info.authors ? info.authors.map((a: { name: string }) => a.name).join(', ') : '',
            dateSortie: info.publish_date || '',
            editeur: info.publishers ? info.publishers.map((p: { name: string }) => p.name).join(', ') : '',
            categorie: info.subjects ? info.subjects[0]?.name : '',
            image: info.cover?.medium || '',
            pages: info.number_of_pages || 0
          }
        }
      } catch (e) {
        console.log('Erreur Open Library:', e)
      }

      const finalBook = {
        isbn: isbn,
        titre: gBook.titre || olBook.titre || 'Inconnu',
        sousTitre: gBook.sousTitre || '',
        auteur: gBook.auteur || olBook.auteur || 'Inconnu',
        dateSortie: gBook.dateSortie || olBook.dateSortie || '',
        editeur: gBook.editeur || olBook.editeur || '',
        categorie: gBook.categorie || olBook.categorie || '',
        description: gBook.description || '',
        image: gBook.image || olBook.image || '',
        pages: (gBook.pages as number) > 0 ? gBook.pages : (olBook.pages || 0)
      }

      const res = await fetch('/api/livres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalBook)
      })

      if (res.ok) {
        setStatus({ type: 'success', message: 'Livre ajoute !' })
        setIsbn('')
        onBookAdded()
        setTimeout(() => setStatus({ type: null, message: '' }), 3000)
      } else {
        const error = await res.json()
        setStatus({ type: 'error', message: error.error || 'Erreur' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setStatus({ type: 'error', message: 'Erreur de connexion' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') scanLivre()
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--text-muted)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Entrer un ISBN pour ajouter un livre..."
          className="w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)'
          }}
          disabled={loading}
        />
      </div>
      <button
        onClick={scanLivre}
        disabled={loading || !isbn.trim()}
        className="btn-primary flex items-center gap-2 whitespace-nowrap"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Recherche...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Ajouter</span>
          </>
        )}
      </button>
      {status.type && (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium animate-fade-in"
          style={{
            backgroundColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status.type === 'success' ? 'var(--success)' : 'var(--error)'
          }}
        >
          {status.type === 'success' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {status.message}
        </div>
      )}
    </div>
  )
}
