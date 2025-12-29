'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    // Validate password strength
    const passwordErrors = []
    if (password.length < 8) passwordErrors.push('8 caracteres minimum')
    if (!/[A-Z]/.test(password)) passwordErrors.push('une majuscule')
    if (!/[a-z]/.test(password)) passwordErrors.push('une minuscule')
    if (!/[0-9]/.test(password)) passwordErrors.push('un chiffre')

    if (passwordErrors.length > 0) {
      setError(`Le mot de passe doit contenir: ${passwordErrors.join(', ')}`)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription')
        return
      }

      // Auto login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.ok) {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
             style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Creer un compte</h1>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Rejoignez Clodotech gratuitement</p>
        </div>

        {/* Form */}
        <div className="rounded-xl p-8" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Nom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark w-full"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark w-full"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark w-full"
                placeholder="••••••••"
                required
              />
              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <svg className="w-3 h-3" fill={password.length >= 8 ? '#22c55e' : 'var(--text-muted)'} viewBox="0 0 20 20">
                    {password.length >= 8 ? (
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    ) : (
                      <circle cx="10" cy="10" r="4" />
                    )}
                  </svg>
                  <span style={{ color: password.length >= 8 ? '#22c55e' : 'var(--text-muted)' }}>8 caracteres minimum</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <svg className="w-3 h-3" fill={/[A-Z]/.test(password) ? '#22c55e' : 'var(--text-muted)'} viewBox="0 0 20 20">
                    {/[A-Z]/.test(password) ? (
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    ) : (
                      <circle cx="10" cy="10" r="4" />
                    )}
                  </svg>
                  <span style={{ color: /[A-Z]/.test(password) ? '#22c55e' : 'var(--text-muted)' }}>Une majuscule</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <svg className="w-3 h-3" fill={/[a-z]/.test(password) ? '#22c55e' : 'var(--text-muted)'} viewBox="0 0 20 20">
                    {/[a-z]/.test(password) ? (
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    ) : (
                      <circle cx="10" cy="10" r="4" />
                    )}
                  </svg>
                  <span style={{ color: /[a-z]/.test(password) ? '#22c55e' : 'var(--text-muted)' }}>Une minuscule</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <svg className="w-3 h-3" fill={/[0-9]/.test(password) ? '#22c55e' : 'var(--text-muted)'} viewBox="0 0 20 20">
                    {/[0-9]/.test(password) ? (
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    ) : (
                      <circle cx="10" cy="10" r="4" />
                    )}
                  </svg>
                  <span style={{ color: /[0-9]/.test(password) ? '#22c55e' : 'var(--text-muted)' }}>Un chiffre</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-dark w-full"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creation...
                </>
              ) : (
                'Creer mon compte'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p style={{ color: 'var(--text-muted)' }}>
              Deja un compte ?{' '}
              <Link href="/login" className="font-medium" style={{ color: 'var(--accent)' }}>
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
