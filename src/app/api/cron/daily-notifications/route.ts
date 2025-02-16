// src/app/api/cron/daily-notifications/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendScheduleEmail } from '@/lib/email'
import { Schedule, Article, Platform } from '@prisma/client'

type ScheduleWithRelations = Schedule & {
  article: Article;
  platform: Platform;
}

export async function GET() {
  try {
    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get tomorrow's date at midnight
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Find all schedules for today with their related articles and platforms
    const schedules = await prisma.schedule.findMany({
      where: {
        publishDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        article: true,
        platform: true
      }
    })

    // Group schedules by user
    const userSchedules = new Map<string, ScheduleWithRelations[]>()
    
    for (const schedule of schedules) {
      const user = await prisma.user.findUnique({
        where: { id: schedule.article.userId },
        include: {
          settings: true
        }
      })

      if (user?.settings?.emailNotifications) {
        const email = user.settings.notificationEmail || user.email
        if (!userSchedules.has(email)) {
          userSchedules.set(email, [])
        }
        userSchedules.get(email)?.push(schedule as ScheduleWithRelations)
      }
    }

    // Send emails to each user
    for (const [email, schedules] of userSchedules.entries()) {
      await sendScheduleEmail(schedules, email)
    }

    return NextResponse.json({
      message: 'Daily notifications sent successfully',
      schedulesProcessed: schedules.length
    })
  } catch (error) {
    console.error('Error sending daily notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send daily notifications' },
      { status: 500 }
    )
  }
}