// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
})

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { subscriptionType } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const priceId = subscriptionType === 'annual' 
      ? process.env.STRIPE_PRIME_ANNUAL_PRICE_ID 
      : process.env.STRIPE_PRIME_MONTHLY_PRICE_ID

    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/settings`,
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