// src/lib/scheduler.ts

import { prisma } from '@/lib/db'

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