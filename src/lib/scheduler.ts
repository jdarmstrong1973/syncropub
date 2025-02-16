// src/lib/scheduler.ts

import { prisma } from '@/lib/db'
import { Schedule, Article, Platform } from '@prisma/client'
import cron from 'node-cron'
import { sendScheduleEmail } from './email'

export type ScheduleWithRelations = Schedule & {
  article: Article;
  platform: Platform;
}

export async function getUpcomingSchedule(userId: string) {
  const now = new Date()
  
  return await prisma.schedule.findMany({
    where: {
      article: {
        userId: userId
      },
      publishDate: {
        gte: now
      }
    },
    include: {
      article: true,
      platform: true
    },
    orderBy: {
      publishDate: 'asc'
    }
  })
}

export async function createScheduleForArticle(articleId: string, platforms: string[]) {
  const article = await prisma.article.findUnique({
    where: { id: articleId }
  })

  if (!article) {
    throw new Error('Article not found')
  }

  const schedules = await Promise.all(
    platforms.map(async (platformId) => {
      return prisma.schedule.create({
        data: {
          articleId,
          platformId,
          publishDate: article.publishDate
        },
        include: {
          article: true,
          platform: true
        }
      })
    })
  )

  return schedules
}

export async function setupDailyNotifications() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Find all schedules for today
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

  return {
    schedulesProcessed: schedules.length,
    emailsSent: userSchedules.size
  }
}