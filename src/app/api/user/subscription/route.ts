import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
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