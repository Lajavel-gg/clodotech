import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { registerSchema, validate } from '@/lib/validation'
import { rateLimit, authRateLimitOptions, getClientIP } from '@/lib/rateLimit'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitResult = rateLimit(`register:${ip}`, authRateLimitOptions)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Reessayez dans 15 minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validation avec Zod
    const validation = validate(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est deja utilise' },
        { status: 400 }
      )
    }

    // Hash password avec cost factor plus eleve
    const hashedPassword = await bcrypt.hash(password, 14)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0]
      }
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name
    })
  } catch (error) {
    console.error('Erreur inscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
