// src/app/api/cron/route.ts
import { NextResponse } from 'next/server'
import { setupDailyNotifications } from '@/lib/scheduler'

export async function GET() {
  try {
    const result = await setupDailyNotifications()
    return NextResponse.json({
      message: 'Daily notifications sent successfully',
      ...result
    })
  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json(
      { error: 'Failed to process daily notifications' },
      { status: 500 }
    )
  }
}