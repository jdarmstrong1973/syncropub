// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'  // Update to latest version
})

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the body to determine subscription type
    const { subscriptionType } = await request.json()

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Choose the appropriate price ID based on subscription type
    const priceId = subscriptionType === 'annual' 
      ? process.env.STRIPE_PRIME_ANNUAL_PRICE_ID 
      : process.env.STRIPE_PRIME_MONTHLY_PRICE_ID

    // Create Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.NEXTAUTH_URL}/auth/settings`,  // Update path to match your app
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        subscriptionType: subscriptionType
      }
    })

    return NextResponse.json({ 
      sessionId: stripeSession.id,
      url: stripeSession.url 
    })
  } catch (error) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json({ 
      error: 'Failed to create checkout session' 
    }, { status: 500 })
  }
}