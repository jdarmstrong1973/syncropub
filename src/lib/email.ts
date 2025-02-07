import { Resend } from 'resend'
import { Schedule, Article } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)

// Define a type for the schedule items
type ScheduleWithArticle = Schedule & { article: Article }

export async function sendDailySchedule(email: string, schedule: ScheduleWithArticle[]) {
  console.log('Attempting to send email to:', email)
  
  try {
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    })

    const scheduleHtml = schedule
      .map(item => `
        <tr>
          <td style="padding: 8px; font-weight: bold;">${item.article.title}</td>
          <td style="padding: 8px;">${item.platform}</td>
        </tr>
      `)
      .join('')

    const result = await resend.emails.send({
      from: 'SyncroPub <notifications@syncopub.com>',
      to: email,
      subject: `Publishing Reminder: ${today}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Your Publishing Schedule</h2>
          <p style="text-align: center; color: #666;">You have articles scheduled for publishing today.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px; background-color: #f4f4f4;">Article</th>
                <th style="text-align: left; padding: 8px; background-color: #f4f4f4;">Platform</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleHtml}
            </tbody>
          </table>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://your-syncopub-url.com" style="
              display: inline-block;
              background-color: #6b46c1;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
            ">
              Login to SyncroPub
            </a>
          </div>
          
          <p style="text-align: center; color: #888; margin-top: 20px; font-size: 12px;">
            This is an automated reminder from SyncroPub
          </p>
        </div>
      `
    })
    console.log('Email sent successfully:', result)
    return result
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

// Alias for compatibility
export const sendEmail = sendDailySchedule