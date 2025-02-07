import { NextResponse } from 'next/server'
import { setupDailyNotifications } from '@/lib/scheduler'

export async function GET() {
  setupDailyNotifications()
  return NextResponse.json({ message: 'Scheduler initialized' })
}