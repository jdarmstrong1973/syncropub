import { NextResponse } from 'next/server'
import { PrismaClient, type Schedule } from '@prisma/client'
import { sendEmail } from '@/lib/email'

// Singleton Prisma client
const prisma = new PrismaClient()

export async function GET() {
  try {
    // Create a date object for the start and end of today
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    // Fetch users with email notifications and their articles
    const users = await prisma.user.findMany({
      where: {
        settings: {
          emailNotifications: true
        }
      },
      include: {
        settings: true,
        articles: {
          where: {
            schedule: {
              some: {
                publishDate: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          },
          include: {
            schedule: true
          }
        }
      }
    })

    // Process each user
    for (const user of users) {
      // Collect schedules for today with their associated articles
      const todaysSchedule = user.articles.flatMap(article => 
        article.schedule
          .filter(schedule => {
            const scheduleDate = new Date(schedule.publishDate)
            return (
              scheduleDate >= startOfDay && 
              scheduleDate < endOfDay
            )
          })
          .map(schedule => ({
            ...schedule,
            article: article
          }))
      )

      // Send email if there are schedules today
      if (todaysSchedule.length > 0) {
        const emailAddress = user.settings?.notificationEmail || user.email

        if (emailAddress) {
          await sendEmail(emailAddress, todaysSchedule)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}

export {}