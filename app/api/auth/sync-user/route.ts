import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Sync user from Supabase Auth to Prisma database
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user already exists in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email!,
          phone: user.phone || null,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        user: updatedUser,
        action: 'updated',
      })
    }

    // Create new user in Prisma
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        phone: user.phone || null,
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
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync user' },
      { status: 500 }
    )
  }
}

