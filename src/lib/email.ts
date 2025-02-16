// src/lib/email.ts

import { Schedule } from '@prisma/client'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type ScheduleWithRelations = Schedule & {
  article: {
    title: string
  }
  platform: {
    name: string
  }
}

export async function sendScheduleEmail(schedules: ScheduleWithRelations[], email: string) {
  const scheduleList = schedules
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; font-weight: bold;">${item.article.title}</td>
          <td style="padding: 8px;">${item.platform.name}</td>
        </tr>
      `
    )
    .join('')

  const html = `
    <div style="font-family: sans-serif;">
      <h2>Your Publishing Schedule for Today</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="padding: 8px; text-align: left;">Article</th>
            <th style="padding: 8px; text-align: left;">Platform</th>
          </tr>
        </thead>
        <tbody>
          ${scheduleList}
        </tbody>
      </table>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'SyncroPub <notifications@syncropub.com>',
      to: email,
      subject: 'Your Publishing Schedule for Today',
      html
    })
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}