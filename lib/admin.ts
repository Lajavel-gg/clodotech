import { auth } from './auth'
import { NextResponse } from 'next/server'
import { Session } from 'next-auth'

// Verifier si l'utilisateur est admin
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === 'admin'
}

// Types pour le resultat de requireAdmin
type AdminCheckFailed = {
  authorized: false
  response: NextResponse
  session?: never
}

type AdminCheckSuccess = {
  authorized: true
  response?: never
  session: Session
}

type AdminCheckResult = AdminCheckFailed | AdminCheckSuccess

// Helper pour les routes API admin
export async function requireAdmin(): Promise<AdminCheckResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }
  }

  if (session.user.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Acces refuse - Admin requis' }, { status: 403 })
    }
  }

  return {
    authorized: true,
    session
  }
}
