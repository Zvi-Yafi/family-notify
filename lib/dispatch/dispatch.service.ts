import { prisma } from '@/lib/prisma'
import { emailProvider } from '@/lib/providers/email.provider'
import { pushProvider } from '@/lib/providers/push.provider'
import { smsProvider } from '@/lib/providers/sms.provider'
import { whatsAppProvider } from '@/lib/providers/whatsapp.provider'
import { CommunicationChannel, DeliveryStatus } from '@prisma/client'

export interface DispatchAnnouncementOptions {
  announcementId: string
  familyGroupId: string
}

export interface DispatchEventReminderOptions {
  eventId: string
  familyGroupId: string
}

export class DispatchService {
  /**
   * Dispatch an announcement to all members based on their preferences
   */
  async dispatchAnnouncement(options: DispatchAnnouncementOptions): Promise<void> {
    const announcement = await prisma.announcement.findUnique({
      where: { id: options.announcementId },
      include: {
        familyGroup: true,
        creator: true,
      },
    })

    if (!announcement) {
      throw new Error('Announcement not found')
    }

    // Get all members of the family group with their preferences
    const memberships = await prisma.membership.findMany({
      where: { familyGroupId: options.familyGroupId },
      include: {
        user: {
          include: {
            preferences: {
              where: { enabled: true },
            },
          },
        },
      },
    })

    console.log(`📢 Dispatching announcement "${announcement.title}" to ${memberships.length} members`)

    // Create delivery attempts for each user and their enabled channels
    for (const membership of memberships) {
      for (const preference of membership.user.preferences) {
        // Skip if not verified
        if (!preference.verifiedAt) {
          console.log(`⏭️  Skipping ${preference.channel} for ${membership.user.email} - not verified`)
          continue
        }

        // Create delivery attempt
        const attempt = await prisma.deliveryAttempt.create({
          data: {
            itemType: 'ANNOUNCEMENT',
            itemId: announcement.id,
            userId: membership.user.id,
            channel: preference.channel,
            status: 'QUEUED',
          },
        })

        // Send immediately
        await this.sendDeliveryAttempt(attempt.id, announcement, membership.user, preference)
      }
    }
  }

  /**
   * Dispatch event reminders
   */
  async dispatchEventReminder(options: DispatchEventReminderOptions): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: options.eventId },
      include: {
        familyGroup: true,
        creator: true,
      },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Get all members of the family group with their preferences
    const memberships = await prisma.membership.findMany({
      where: { familyGroupId: options.familyGroupId },
      include: {
        user: {
          include: {
            preferences: {
              where: { enabled: true },
            },
          },
        },
      },
    })

    console.log(`📅 Dispatching event reminder "${event.title}" to ${memberships.length} members`)

    // Create delivery attempts for each user and their enabled channels
    for (const membership of memberships) {
      for (const preference of membership.user.preferences) {
        // Skip if not verified
        if (!preference.verifiedAt) {
          console.log(`⏭️  Skipping ${preference.channel} for ${membership.user.email} - not verified`)
          continue
        }

        // Create delivery attempt
        const attempt = await prisma.deliveryAttempt.create({
          data: {
            itemType: 'EVENT',
            itemId: event.id,
            userId: membership.user.id,
            channel: preference.channel,
            status: 'QUEUED',
          },
        })

        // Send immediately
        await this.sendEventReminder(attempt.id, event, membership.user, preference)
      }
    }
  }

  /**
   * Send a single delivery attempt
   */
  private async sendDeliveryAttempt(
    attemptId: string,
    announcement: any,
    user: any,
    preference: any
  ): Promise<void> {
    try {
      let result: { success: boolean; messageId?: string; error?: string }

      switch (preference.channel) {
        case 'EMAIL':
          result = await emailProvider.send({
            to: preference.destination,
            subject: `${announcement.type === 'SIMCHA' ? '🎉' : '📢'} ${announcement.title}`,
            html: this.buildEmailHtml(announcement, user),
            text: announcement.body,
          })
          break

        case 'SMS':
          result = await smsProvider.send({
            to: preference.destination,
            message: `${announcement.title}\n\n${announcement.body}`,
          })
          break

        case 'WHATSAPP':
          result = await whatsAppProvider.send({
            to: preference.destination,
            message: `${announcement.title}\n\n${announcement.body}`,
          })
          break

        case 'PUSH':
          // For push, destination is the subscription JSON
          try {
            const subscription = JSON.parse(preference.destination)
            result = await pushProvider.send({
              subscription,
              title: announcement.title,
              body: announcement.body,
              data: { announcementId: announcement.id },
            })
          } catch (e) {
            result = { success: false, error: 'Invalid push subscription' }
          }
          break

        default:
          result = { success: false, error: 'Unknown channel' }
      }

      // Update delivery attempt
      await prisma.deliveryAttempt.update({
        where: { id: attemptId },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          providerMessageId: result.messageId,
          error: result.error,
        },
      })

      if (result.success) {
        console.log(`✅ Sent ${preference.channel} to ${user.email}`)
      } else {
        console.error(`❌ Failed to send ${preference.channel} to ${user.email}: ${result.error}`)
      }
    } catch (error: any) {
      console.error(`❌ Error sending to ${user.email}:`, error)
      await prisma.deliveryAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      })
    }
  }

  /**
   * Send event reminder
   */
  private async sendEventReminder(
    attemptId: string,
    event: any,
    user: any,
    preference: any
  ): Promise<void> {
    try {
      const timeUntil = this.getTimeUntilEvent(event.startsAt)
      const reminderText = `תזכורת: ${event.title} מתחיל ${timeUntil}${event.location ? ` ב${event.location}` : ''}`

      let result: { success: boolean; messageId?: string; error?: string }

      switch (preference.channel) {
        case 'EMAIL':
          result = await emailProvider.send({
            to: preference.destination,
            subject: `⏰ תזכורת: ${event.title}`,
            html: this.buildEventReminderHtml(event, user, timeUntil),
            text: reminderText,
          })
          break

        case 'SMS':
          result = await smsProvider.send({
            to: preference.destination,
            message: reminderText,
          })
          break

        case 'WHATSAPP':
          result = await whatsAppProvider.send({
            to: preference.destination,
            message: reminderText,
          })
          break

        case 'PUSH':
          try {
            const subscription = JSON.parse(preference.destination)
            result = await pushProvider.send({
              subscription,
              title: `⏰ תזכורת: ${event.title}`,
              body: `מתחיל ${timeUntil}`,
              data: { eventId: event.id },
            })
          } catch (e) {
            result = { success: false, error: 'Invalid push subscription' }
          }
          break

        default:
          result = { success: false, error: 'Unknown channel' }
      }

      await prisma.deliveryAttempt.update({
        where: { id: attemptId },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          providerMessageId: result.messageId,
          error: result.error,
        },
      })

      if (result.success) {
        console.log(`✅ Sent event reminder via ${preference.channel} to ${user.email}`)
      } else {
        console.error(`❌ Failed event reminder via ${preference.channel} to ${user.email}: ${result.error}`)
      }
    } catch (error: any) {
      console.error(`❌ Error sending event reminder to ${user.email}:`, error)
      await prisma.deliveryAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      })
    }
  }

  private buildEmailHtml(announcement: any, user: any): string {
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">${announcement.type === 'SIMCHA' ? '🎉' : '📢'} ${announcement.title}</h1>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${announcement.body.replace(/\n/g, '<br>')}
        </div>
        <p style="color: #666; font-size: 14px;">
          הודעה זו נשלחה מ-FamilyNotify<br>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences">נהל העדפות קבלה</a>
        </p>
      </div>
    `
  }

  private buildEventReminderHtml(event: any, user: any, timeUntil: string): string {
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">⏰ תזכורת לאירוע</h1>
        <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #3b82f6;">
          <h2 style="margin-top: 0;">${event.title}</h2>
          <p><strong>מתחיל:</strong> ${timeUntil}</p>
          ${event.location ? `<p><strong>מיקום:</strong> ${event.location}</p>` : ''}
          ${event.description ? `<p>${event.description}</p>` : ''}
        </div>
        <p style="color: #666; font-size: 14px;">
          תזכורת מ-FamilyNotify<br>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/events">ראה את כל האירועים</a> | 
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences">נהל העדפות</a>
        </p>
      </div>
    `
  }

  private getTimeUntilEvent(startsAt: Date): string {
    const now = new Date()
    const start = new Date(startsAt)
    const diffMs = start.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `בעוד ${diffDays} ימים`
    } else if (diffHours > 0) {
      return `בעוד ${diffHours} שעות`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `בעוד ${diffMinutes} דקות`
    }
  }
}

export const dispatchService = new DispatchService()



