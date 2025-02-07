import { NextResponse } from 'next/server'
import { sendDailySchedule } from '@/lib/email'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get user's settings and articles for today
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        settings: true,
        articles: {
          include: {
            schedule: true
          }
        }
      }
    })

    if (!user?.settings?.emailNotifications) {
      return NextResponse.json({ error: 'Email notifications not enabled' }, { status: 400 })
    }

    const today = new Date()
    const todaysSchedule = user.articles
      .flatMap(article => article.schedule.map(schedule => ({
        article,
        ...schedule
      })))
      .filter(schedule => {
        const scheduleDate = new Date(schedule.publishDate)
        return scheduleDate.toDateString() === today.toDateString()
      })

    const emailAddress = user.settings.notificationEmail || user.email

    await sendDailySchedule(emailAddress, todaysSchedule)

    return NextResponse.json({ success: true, message: 'Test email sent' })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}