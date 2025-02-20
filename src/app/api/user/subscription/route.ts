import { NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ subscriptionStatus: 'solo' }) // Default to solo if no user found
    }

    // Return the subscription status
    return NextResponse.json({
      subscriptionStatus: user.subscriptionStatus || 'solo'
    })

  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 })
  }
}