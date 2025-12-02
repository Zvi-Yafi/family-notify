import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Create user in Prisma database (for signup before email confirmation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, phone } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (existingUser) {
      return NextResponse.json({
        success: true,
        user: existingUser,
        action: 'exists',
      })
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: email,
        phone: phone || null,
      },
    })

    // Create default EMAIL preference
    try {
      await prisma.preference.create({
        data: {
          userId: newUser.id,
          channel: 'EMAIL',
          enabled: true,
          destination: newUser.email,
          verifiedAt: new Date(), // Auto-verify email since they signed up with it
        },
      })
    } catch (prefError) {
      console.error('Failed to create default email preference:', prefError)
      // Don't fail user creation if preference creation fails
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      action: 'created',
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}

