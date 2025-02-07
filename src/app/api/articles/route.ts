import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Define types for better TypeScript support
interface Platform {
  platform: string;
  publishDate: Date;
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      articles: {
        include: {
          schedule: true
        }
      }
    }
  })

  return NextResponse.json({ articles: user?.articles || [] })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { title, status, publishDate } = await request.json()
    const baseDate = new Date(publishDate)

    // Get user's selected platforms
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true }
    })

    const selectedPlatforms: string[] = user?.settings?.platforms ? 
      JSON.parse(user?.settings?.platforms) : []

    // Calculate publish dates for each platform
    const schedules: Platform[] = selectedPlatforms.map((platform: string, index: number) => {
      let platformPublishDate: Date;
      
      if (status === 'draft' && index === 0) {
        // First platform publishes same day for unpublished articles
        platformPublishDate = baseDate;
      } else if (status === 'published') {
        // First platform publishes 5 days after the base date for published articles
        // Subsequent platforms 2 days apart from the first platform
        platformPublishDate = new Date(baseDate.getTime() + ((index === 0 ? 5 : (5 + (2 * (index)))) * 24 * 60 * 60 * 1000));
      } else {
        // Add 2 days for each subsequent platform
        platformPublishDate = new Date(baseDate.getTime() + (index * 2 * 24 * 60 * 60 * 1000));
      }
    
      return {
        platform,
        publishDate: platformPublishDate
      }
    });

    // Create article with schedule
    const article = await prisma.article.create({
      data: {
        title,
        status,
        publishDate: baseDate,
        user: {
          connect: { email: session.user.email }
        },
        schedule: {
          create: schedules
        }
      },
      include: {
        schedule: true
      }
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { articleId, scheduleId } = await request.json()

    // Verify the article belongs to the user
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        user: {
          email: session.user.email
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Delete the schedule
    await prisma.schedule.delete({
      where: {
        id: scheduleId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { action, articleId } = await request.json()

    // Verify the article belongs to the user
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        user: {
          email: session.user.email
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (action === 'delete_article') {
      // Delete all schedules first due to foreign key constraints
      await prisma.schedule.deleteMany({
        where: {
          articleId
        }
      })
      // Then delete the article
      await prisma.article.delete({
        where: {
          id: articleId
        }
      })
    } else if (action === 'update_platforms') {
      // Get user's current platform settings
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { settings: true }
      })

      const selectedPlatforms: string[] = user?.settings?.platforms ? 
        JSON.parse(user.settings.platforms) : []

      // Get current article schedules
      const currentArticle = await prisma.article.findUnique({
        where: { id: articleId },
        include: { schedule: true }
      })

      if (currentArticle) {
        // Add new platforms with updated timing logic
        const existingPlatforms = currentArticle.schedule.map(s => s.platform)
        const newPlatforms = selectedPlatforms.filter((p: string) => !existingPlatforms.includes(p))

        for (const [index, platform] of newPlatforms.entries()) {
          const platformIndex = selectedPlatforms.indexOf(platform)
          const publishDate = new Date(currentArticle.publishDate.getTime() + 
            (platformIndex * 2 * 24 * 60 * 60 * 1000))

          await prisma.schedule.create({
            data: {
              platform,
              publishDate,
              articleId
            }
          })
        }

        // Remove platforms that are no longer selected
        await prisma.schedule.deleteMany({
          where: {
            articleId,
            platform: {
              notIn: selectedPlatforms
            }
          }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error performing article operation:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}