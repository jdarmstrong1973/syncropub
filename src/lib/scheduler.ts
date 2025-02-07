import * as cron from 'node-cron'
import { PrismaClient, Schedule, Article, User } from '@prisma/client'
import { sendEmail } from '@/lib/email'

// Ensure Prisma client is a singleton
const prisma = new PrismaClient()

export function setupDailyNotifications() {
  if (typeof window === 'undefined') {
    console.log('⏰ Daily Notifications Scheduler Setup Started')

    cron.schedule('*/5 * * * *', async () => {  // Every 5 minutes
      console.log('🔔 Daily Notifications Job Started')
      try {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

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

        console.log(`🔍 Found ${users.length} users with notifications enabled`)

        for (const user of users) {
          // Fetch ALL schedules for debugging
          const allUserSchedules = await prisma.schedule.findMany({
            where: {
              article: {
                userId: user.id
              }
            },
            include: {
              article: true
            }
          })

          console.log(`📅 User ${user.email} total schedules: ${allUserSchedules.length}`)
          console.log('All schedules:', allUserSchedules.map(schedule => ({
            id: schedule.id,
            platform: schedule.platform,
            publishDate: schedule.publishDate,
            articleTitle: schedule.article.title
          })))

          const todaysSchedule = user.articles.flatMap(article => 
            article.schedule
              .filter(schedule => {
                const scheduleDate = new Date(schedule.publishDate)
                console.log(`Checking schedule: ${scheduleDate} against range ${startOfDay} - ${endOfDay}`)
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

          console.log(`📅 User ${user.email} has ${todaysSchedule.length} schedules today`)

          if (todaysSchedule.length > 0) {
            const emailAddress = user.settings?.notificationEmail || user.email

            if (emailAddress) {
              console.log(`📧 Sending email to ${emailAddress}`)
              await sendEmail(emailAddress, todaysSchedule)
            }
          } else {
            console.log(`❌ No schedules today for ${user.email}`)
          }
        }

        console.log('🎉 Notifications Job Completed')
      } catch (error) {
        console.error('❌ Daily Notifications Job Failed:', error)
      }
    })
  }
}

export {}