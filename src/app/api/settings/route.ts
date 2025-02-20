// src/app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
  const { userId } = await auth()

  if (!userId) {
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
      where: { id: userId },
      create: { 
        id: userId,
        email: notificationEmail,
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