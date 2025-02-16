// src/app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true }
    })

    const platforms = user?.settings?.platforms ? JSON.parse(user.settings.platforms) : []
    const socialMedia = user?.settings?.socialMedia ? JSON.parse(user.settings.socialMedia) : []
    const emailNotifications = user?.settings?.emailNotifications || false
    const notificationEmail = user?.settings?.notificationEmail || ''
    
    return NextResponse.json({ 
      platforms, 
      socialMedia, 
      emailNotifications,
      notificationEmail 
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { 
      platforms, 
      socialMedia, 
      emailNotifications, 
      notificationEmail 
    } = await request.json()

    const platformsJson = JSON.stringify(platforms)
    const socialMediaJson = JSON.stringify(socialMedia)

    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      create: { 
        email: session.user.email,
        settings: { 
          create: { 
            platforms: platformsJson,
            socialMedia: socialMediaJson,
            emailNotifications: emailNotifications || false,
            notificationEmail: notificationEmail || ''
          } 
        }
      },
      update: {
        settings: {
          upsert: {
            create: { 
              platforms: platformsJson,
              socialMedia: socialMediaJson,
              emailNotifications: emailNotifications || false,
              notificationEmail: notificationEmail || ''
            },
            update: { 
              platforms: platformsJson,
              socialMedia: socialMediaJson,
              emailNotifications: emailNotifications || false,
              notificationEmail: notificationEmail || ''
            }
          }
        }
      },
      include: { settings: true }
    })

    return NextResponse.json({ 
      platforms: JSON.parse(user.settings?.platforms || '[]'),
      socialMedia: JSON.parse(user.settings?.socialMedia || '[]'),
      emailNotifications: user.settings?.emailNotifications || false,
      notificationEmail: user.settings?.notificationEmail || ''
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}