import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

const prisma = new PrismaClient()

// Define a type for schedule items
interface ScheduleItem {
  platform: string;
  publishDate: string;
  content?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const articles = await prisma.article.findMany({
      where: {
        userId: userId
      },
      include: {
        schedule: true
      }
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { title, status, publishDate, schedule } = await request.json()

    const article = await prisma.article.create({
      data: {
        title,
        status,
        publishDate: new Date(publishDate),
        userId: userId,
        schedule: {
          create: schedule.map((item: ScheduleItem) => ({
            platform: item.platform,
            publishDate: new Date(item.publishDate),
            content: item.content
          }))
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

export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id, title, status, publishDate, schedule } = await request.json()

    // Delete existing schedules to replace them
    await prisma.schedule.deleteMany({
      where: {
        articleId: id
      }
    })

    const article = await prisma.article.update({
      where: {
        id: id
      },
      data: {
        title,
        status,
        publishDate: new Date(publishDate),
        schedule: {
          create: schedule.map((item: ScheduleItem) => ({
            platform: item.platform,
            publishDate: new Date(item.publishDate),
            content: item.content
          }))
        }
      },
      include: {
        schedule: true
      }
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await request.json()

    // Delete associated schedules first
    await prisma.schedule.deleteMany({
      where: {
        articleId: id
      }
    })

    const article = await prisma.article.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
  }
}