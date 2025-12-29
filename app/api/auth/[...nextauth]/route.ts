import { handlers } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, authRateLimitOptions, getClientIP } from '@/lib/rateLimit'

export const { GET } = handlers

// Wrapper pour ajouter le rate limiting au POST (login)
export async function POST(request: NextRequest) {
  // Verifier si c'est une tentative de login
  const url = new URL(request.url)
  const isCredentialsLogin = url.pathname.includes('callback/credentials')

  if (isCredentialsLogin) {
    const ip = getClientIP(request)
    const rateLimitResult = rateLimit(`login:${ip}`, authRateLimitOptions)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Reessayez dans 15 minutes.' },
        { status: 429 }
      )
    }
  }

  // Appeler le handler original
  return handlers.POST(request)
}
