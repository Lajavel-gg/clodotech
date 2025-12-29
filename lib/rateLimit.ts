// ============================================
// Rate Limiting simple en memoire
// Pour production: utiliser Redis ou upstash/ratelimit
// ============================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Nettoyer les entrees expirees toutes les 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  maxRequests: number  // Nombre max de requetes
  windowMs: number     // Fenetre de temps en ms
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  let entry = rateLimitStore.get(key)

  // Si pas d'entree ou fenetre expiree, creer nouvelle entree
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + options.windowMs
    }
    rateLimitStore.set(key, entry)
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetTime: entry.resetTime
    }
  }

  // Incrementer le compteur
  entry.count++

  // Verifier si limite depassee
  if (entry.count > options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }

  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

// Configuration par defaut pour l'authentification
export const authRateLimitOptions: RateLimitOptions = {
  maxRequests: 5,      // 5 tentatives
  windowMs: 15 * 60 * 1000  // par 15 minutes
}

// Configuration pour les API generales
export const apiRateLimitOptions: RateLimitOptions = {
  maxRequests: 100,    // 100 requetes
  windowMs: 60 * 1000  // par minute
}

// Helper pour obtenir l'IP du client
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return 'unknown'
}
