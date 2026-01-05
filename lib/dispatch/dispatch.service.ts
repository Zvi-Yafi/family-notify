import { prisma } from '@/lib/prisma'
import { emailProvider } from '@/lib/providers/email.provider'
import { pushProvider } from '@/lib/providers/push.provider'
import { smsProvider } from '@/lib/providers/sms.provider'
import { whatsAppProvider } from '@/lib/providers/whatsapp.provider'
import { CommunicationChannel, DeliveryStatus } from '@prisma/client'
import { formatInTimeZone } from 'date-fns-tz'
import { he } from 'date-fns/locale'
import { getHebrewDateString, getFullHebrewDate } from '@/lib/utils/hebrew-date-utils'

export interface DispatchAnnouncementOptions {
  announcementId: string
  familyGroupId: string
}

export interface DispatchEventReminderOptions {
  eventId?: string // For old-style reminders (deprecated)
  eventReminderId?: string // For new-style reminders
  familyGroupId: string
  isInitial?: boolean // Added: true for the first "New Event" notification
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

    console.log(`\n📢 מתחיל לשלוח הודעה:`)
    console.log(`   כותרת: "${announcement.title}"`)
    console.log(`   קבוצה: ${announcement.familyGroup.name}`)
    console.log(`   סה"כ חברים: ${memberships.length}`)

    // Count total delivery attempts
    let totalDeliveries = 0
    memberships.forEach((m) => {
      totalDeliveries += m.user.preferences.length
    })
    console.log(`   סה"כ שליחות (כולל כל הערוצים): ${totalDeliveries}`)

    // Create delivery attempts for each user and their enabled channels
    for (const membership of memberships) {
      const userName = membership.user.name || membership.user.email.split('@')[0]
      console.log(`\n👤 שולח ל-${userName} (${membership.user.email})...`)

      for (const preference of membership.user.preferences) {
        // Skip if not verified
        if (!preference.verifiedAt) {
          console.log(`   ⏭️  ${preference.channel}: לא מאומת - מדלג`)
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

    console.log(`\n✨ סיום שליחת ההודעה "${announcement.title}"`)
  }

  /**
   * Dispatch event reminders
   */
  async dispatchEventReminder(options: DispatchEventReminderOptions): Promise<void> {
    let event: any
    let customMessage: string | null = null

    // New style: using eventReminderId
    if (options.eventReminderId) {
      const reminder = await prisma.eventReminder.findUnique({
        where: { id: options.eventReminderId },
        include: {
          event: {
            include: {
              familyGroup: true,
              creator: true,
            },
          },
        },
      })

      if (!reminder) {
        throw new Error('Event reminder not found')
      }

      event = reminder.event
      customMessage = reminder.message
    }
    // Old style: using eventId (for backward compatibility)
    else if (options.eventId) {
      event = await prisma.event.findUnique({
        where: { id: options.eventId },
        include: {
          familyGroup: true,
          creator: true,
        },
      })

      if (!event) {
        throw new Error('Event not found')
      }
    } else {
      throw new Error('Either eventId or eventReminderId must be provided')
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
    console.log(`   Detailed Event Data:`, {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      typeOfStartsAt: typeof event.startsAt,
      instanceOfStartsAt: event.startsAt instanceof Date,
    })
    if (customMessage) {
      console.log(`   הודעה מותאמת אישית: "${customMessage}"`)
    }

    // Create delivery attempts for each user and their enabled channels
    for (const membership of memberships) {
      for (const preference of membership.user.preferences) {
        // Skip if not verified
        if (!preference.verifiedAt) {
          console.log(
            `⏭️  Skipping ${preference.channel} for ${membership.user.email} - not verified`
          )
          continue
        }

        // Create delivery attempt
        const attempt = await prisma.deliveryAttempt.create({
          data: {
            itemType: options.eventReminderId ? 'EVENT_REMINDER' : 'EVENT',
            itemId: options.eventReminderId || event.id,
            userId: membership.user.id,
            channel: preference.channel,
            status: 'QUEUED',
          },
        })

        // Send immediately
        await this.sendEventReminder(
          attempt.id,
          event,
          membership.user,
          preference,
          customMessage,
          options.isInitial
        )
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
          console.log(`   📧 שולח מייל ל-${preference.destination}...`)
          result = await emailProvider.send({
            to: preference.destination,
            subject: `${announcement.type === 'SIMCHA' ? '🎉' : '📢'} ${announcement.title}`,
            html: this.buildEmailHtml(announcement, user),
            text: announcement.body,
          })
          if (result.success) {
            console.log(`   ✅ מייל נשלח בהצלחה (ID: ${result.messageId})`)
          } else {
            console.log(`   ❌ שגיאה במייל: ${result.error}`)
          }
          break

        case 'SMS':
          console.log(`   📱 שולח SMS ל-${preference.destination}...`)
          result = await smsProvider.send({
            to: preference.destination,
            message: `${announcement.title}\n\n${announcement.body}`,
          })
          if (result.success) {
            console.log(`   ✅ SMS נשלח בהצלחה`)
          } else {
            console.log(`   ❌ שגיאה ב-SMS: ${result.error}`)
          }
          break

        case 'WHATSAPP':
          console.log(`   💬 שולח WhatsApp ל-${preference.destination}...`)
          result = await whatsAppProvider.send({
            to: preference.destination,
            message: `${announcement.title}\n\n${announcement.body}`,
          })
          if (result.success) {
            console.log(`   ✅ WhatsApp נשלח בהצלחה`)
          } else {
            console.log(`   ❌ שגיאה ב-WhatsApp: ${result.error}`)
          }
          break

        case 'PUSH':
          console.log(`   🔔 שולח Push notification...`)
          // For push, destination is the subscription JSON
          try {
            const subscription = JSON.parse(preference.destination)
            result = await pushProvider.send({
              subscription,
              title: announcement.title,
              body: announcement.body,
              data: { announcementId: announcement.id },
            })
            if (result.success) {
              console.log(`   ✅ Push נשלח בהצלחה`)
            } else {
              console.log(`   ❌ שגיאה ב-Push: ${result.error}`)
            }
          } catch (e) {
            console.log(`   ❌ שגיאה ב-Push: subscription לא תקין`)
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
    } catch (error: any) {
      console.error(`   ❌ שגיאה לא צפויה: ${error.message}`)
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
    preference: any,
    customMessage?: string | null,
    isInitial: boolean = false
  ): Promise<void> {
    try {
      const timeUntil = this.getTimeUntilEvent(event.startsAt)

      const subject = isInitial ? `📅 אירוע חדש: ${event.title}` : `⏰ תזכורת: ${event.title}`

      // Use custom message if provided, otherwise use default
      const reminderText =
        customMessage ||
        (isInitial
          ? `אירוע חדש: ${event.title} מתחיל ${timeUntil}${event.location ? ` ב${event.location}` : ''}`
          : `תזכורת: ${event.title} מתחיל ${timeUntil}${event.location ? ` ב${event.location}` : ''}`)

      let result: { success: boolean; messageId?: string; error?: string }

      switch (preference.channel) {
        case 'EMAIL':
          result = await emailProvider.send({
            to: preference.destination,
            subject,
            html: this.buildEventReminderHtml(
              event,
              user,
              timeUntil,
              customMessage,
              isInitial,
              event.familyGroup?.name || 'המשפחה'
            ),
            text: reminderText,
          })
          if (result.success) {
            console.log(
              `   ✅ EMAIL sent to ${preference.destination} (Starts: ${event.startsAt instanceof Date ? event.startsAt.toISOString() : event.startsAt})`
            )
          }
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
            message: this.buildEventReminderWhatsAppMessage(
              event,
              timeUntil,
              customMessage,
              isInitial
            ),
            fileUrl: event.fileUrl || event.imageUrl || undefined,
            fileName: event.fileUrl
              ? event.fileUrl.split('/').pop() || 'document.pdf'
              : event.imageUrl
                ? event.imageUrl.split('/').pop() || 'image.jpg'
                : undefined,
          })
          break

        case 'PUSH':
          try {
            const subscription = JSON.parse(preference.destination)
            result = await pushProvider.send({
              subscription,
              title: subject,
              body: isInitial ? `אירוע חדש: ${event.title}` : customMessage || `מתחיל ${timeUntil}`,
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
        console.error(
          `❌ Failed event reminder via ${preference.channel} to ${user.email}: ${result.error}`
        )
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
    const isSimcha = announcement.type === 'SIMCHA'
    const accentColor = isSimcha ? '#8B5CF6' : '#3B82F6'
    const emoji = isSimcha ? '🎉' : '📢'

    return `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${announcement.title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(to bottom, #f8fafc, #f1f5f9); direction: rtl;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom, #f8fafc, #f1f5f9);">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${accentColor} 0%, ${isSimcha ? '#A78BFA' : '#60A5FA'} 100%); padding: 40px 40px 35px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">${emoji}</div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); line-height: 1.3;">
                      ${announcement.title}
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 45px 40px;">
                    <div style="background: linear-gradient(to bottom, #f8fafc, #ffffff); padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; line-height: 1.8; font-size: 16px; color: #334155;">
                      ${announcement.body.replace(/\n/g, '<br>')}
                    </div>
                  </td>
                </tr>
                
                <!-- Action Button -->
                <tr>
                  <td style="padding: 0 40px 40px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/feed" style="display: inline-block; background: ${accentColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: transform 0.2s;">
                      צפה בכל ההודעות
                    </a>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: linear-gradient(to left, transparent, #e2e8f0, transparent);"></div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      הודעה זו נשלחה אליך מ-<strong style="color: ${accentColor};">FamilyNotify</strong>
                    </p>
                    <div style="margin-top: 20px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences" style="color: ${accentColor}; text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 16px; border: 1px solid ${accentColor}; border-radius: 6px; display: inline-block; transition: background 0.2s;">
                        ⚙️ נהל העדפות קבלה
                      </a>
                    </div>
                    <p style="margin: 20px 0 0 0; color: #94a3b8; font-size: 13px;">
                      משפחת Yafi • FamilyNotify
                    </p>
                  </td>
                </tr>
                
              </table>
              
              <!-- Spacer -->
              <div style="height: 20px;"></div>
              
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  private buildEventReminderHtml(
    event: any,
    user: any,
    timeUntil: string,
    customMessage?: string | null,
    isInitial: boolean = false,
    groupName: string = 'המשפחה'
  ): string {
    const tz = 'Asia/Jerusalem'
    const eventStartsAt = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt)

    const formattedDate = formatInTimeZone(eventStartsAt, tz, 'd MMMM yyyy', { locale: he })
    const hebrewDate = getFullHebrewDate(eventStartsAt)
    const formattedTime = formatInTimeZone(eventStartsAt, tz, 'HH:mm')

    // If there is an end time, format it too
    let formattedEndTime = ''
    if (event.endsAt) {
      const eventEndsAt = event.endsAt instanceof Date ? event.endsAt : new Date(event.endsAt)
      formattedEndTime = formatInTimeZone(eventEndsAt, tz, 'HH:mm')
    }

    const headerEmoji = isInitial ? '📅' : '⏰'
    const badgeText = isInitial ? 'אירוע משפחתי חדש' : 'תזכורת לאירוע'
    const headerGradient = isInitial
      ? 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'
      : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
    const bodyBackground = isInitial
      ? 'linear-gradient(to bottom, #eff6ff, #f8fafc)'
      : 'linear-gradient(to bottom, #fef3c7, #fef9e7)'
    const badgeColor = isInitial ? '#3B82F6' : '#f59e0b'

    return `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isInitial ? 'אירוע חדש' : 'תזכורת'}: ${event.title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: ${bodyBackground}; direction: rtl;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: ${bodyBackground};">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header with reminder badge -->
                <tr>
                  <td style="background: ${headerGradient}; padding: 40px 40px 35px; text-align: center; position: relative;">
                    <div style="font-size: 56px; margin-bottom: 8px;">${headerEmoji}</div>
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.25); color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${badgeText}
                    </div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 12px 0 0 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); line-height: 1.4; word-break: break-word;">
                      ${event.title}
                    </h1>
                  </td>
                </tr>
                
                <!-- Time Until Badge -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center;">
                    <div style="display: inline-block; background: ${isInitial ? '#eff6ff' : '#fef3c7'}; padding: 20px 32px; border-radius: 12px; border: 2px solid ${badgeColor};">
                      <div style="font-size: 14px; color: ${isInitial ? '#1e40af' : '#92400e'}; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">מתחיל</div>
                      <div style="font-size: 32px; font-weight: 700; color: ${isInitial ? '#1d4ed8' : '#b45309'}; margin: 0;">${timeUntil}</div>
                    </div>
                  </td>
                </tr>
                
                <!-- Event Details -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    
                    ${
                      event.description
                        ? `
                    <!-- Description -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom, #f8fafc, #ffffff); border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                      <tr>
                        <td>
                          <div style="font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 8px;">פרטים נוספים</div>
                          <div style="font-size: 15px; color: #475569; line-height: 1.6; white-space: pre-wrap;">${event.description}</div>
                        </td>
                      </tr>
                    </table>
                    `
                        : ''
                    }
                    
                    <!-- Date & Time -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom, #f8fafc, #ffffff); border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                      <tr>
                        <td width="48" valign="middle">
                          <div style="width: 40px; height: 40px; background: ${headerGradient}; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 20px;">📅</span>
                          </div>
                        </td>
                        <td valign="middle" style="padding-right: 16px;">
                          <div style="font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 4px;">תאריך ושעה</div>
                          <div style="font-size: 16px; color: #1e293b; font-weight: 600;">${hebrewDate}</div>
                          <div style="font-size: 14px; color: #64748b; font-weight: 500; margin-top: 2px;">תאריך לועזי: ${formattedDate}</div>
                          <div style="font-size: 15px; color: #475569; margin-top: 4px;">
                            ${formattedEndTime ? `בין השעות ${formattedTime} עד ${formattedEndTime}` : `בשעה ${formattedTime}`}
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    ${
                      event.location
                        ? `
                    <!-- Location -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom, #f8fafc, #ffffff); border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                      <tr>
                        <td width="48" valign="middle">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ec4899, #f472b6); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 20px;">📍</span>
                          </div>
                        </td>
                        <td valign="middle" style="padding-right: 16px;">
                          <div style="font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 4px;">מיקום</div>
                          <div style="font-size: 16px; color: #1e293b; font-weight: 600;">${event.location}</div>
                          <div style="margin-top: 8px; display: flex; gap: 12px; flex-wrap: wrap;">
                            <a href="https://waze.com/ul?q=${encodeURIComponent(event.location)}&navigate=yes" style="display: inline-flex; align-items: center; background: #33ccff; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                               🚗 Waze
                            </a>
                            <a href="https://moovitapp.com/?to=${encodeURIComponent(event.location)}&metropolis=israel" style="display: inline-flex; align-items: center; background: #ff6600; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                               🚌 Moovit
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
                    `
                        : ''
                    }

                    ${
                      event.imageUrl
                        ? `
                    <!-- Image -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                      <tr>
                        <td align="center">
                          <img src="${event.imageUrl}" alt="Event Image" style="max-width: 100%; display: block;" />
                        </td>
                      </tr>
                    </table>
                    `
                        : ''
                    }

                    ${
                      event.fileUrl
                        ? `
                    <!-- File Download -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom, #f8fafc, #ffffff); border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                      <tr>
                        <td width="48" valign="middle">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ef4444, #f87171); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 20px;">📄</span>
                          </div>
                        </td>
                        <td valign="middle" style="padding-right: 16px;">
                          <div style="font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 4px;">קובץ מצורף</div>
                          <a href="${event.fileUrl}" style="font-size: 16px; color: #ef4444; font-weight: 600; text-decoration: none;">הורד קובץ PDF</a>
                        </td>
                      </tr>
                    </table>
                    `
                        : ''
                    }
                    
                  </td>
                </tr>
                
                <!-- Action Buttons -->
                <tr>
                  <td style="padding: 0 40px 40px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3); margin: 0 8px;">
                      📅 כל האירועים
                    </a>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: linear-gradient(to left, transparent, #e2e8f0, transparent);"></div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center;">
                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      ${isInitial ? 'הודעה חדשה' : 'תזכורת אוטומטית'} מ-<strong style="color: ${badgeColor};">FamilyNotify</strong>
                    </p>
                    <div style="margin-top: 20px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences" style="color: ${badgeColor}; text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 16px; border: 1px solid ${badgeColor}; border-radius: 6px; display: inline-block;">
                        ⚙️ נהל תזכורות
                      </a>
                    </div>
                    <p style="margin: 20px 0 0 0; color: #94a3b8; font-size: 13px;">
                      ${groupName} • FamilyNotify
                    </p>
                  </td>
                </tr>
                
              </table>
              
              <!-- Spacer -->
              <div style="height: 20px;"></div>
              
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  /**
   * Build WhatsApp message for event reminder
   */
  private buildEventReminderWhatsAppMessage(
    event: any,
    timeUntil: string,
    customMessage?: string | null,
    isInitial: boolean = false
  ): string {
    const tz = 'Asia/Jerusalem'
    const eventStartsAt = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt)

    const formattedDate = formatInTimeZone(eventStartsAt, tz, 'd.M.yyyy', { locale: he })
    const hebrewDate = getFullHebrewDate(eventStartsAt)
    const formattedTime = formatInTimeZone(eventStartsAt, tz, 'HH:mm')

    // If there is an end time, format it too
    let formattedEndTime = ''
    if (event.endsAt) {
      const eventEndsAt = event.endsAt instanceof Date ? event.endsAt : new Date(event.endsAt)
      formattedEndTime = formatInTimeZone(eventEndsAt, tz, 'HH:mm')
    }

    const headerEmoji = isInitial ? '📅' : '⏰'
    const headerText = isInitial ? 'אירוע חדש' : 'תזכורת לאירוע'

    let message = `${headerEmoji} *${headerText}*\n\n`
    message += `*${event.title}*\n\n`

    // Date & Time
    message += `📅 *תאריך:*\n`
    message += `${hebrewDate}\n`
    message += `${formattedDate}\n\n`

    message += `🕐 *שעה:*\n`
    if (formattedEndTime) {
      message += `${formattedTime} - ${formattedEndTime}\n\n`
    } else {
      message += `${formattedTime}\n\n`
    }

    // Time until
    message += `⏳ *${timeUntil}*\n\n`

    // Location
    if (event.location) {
      message += `📍 *מיקום:*\n`
      message += `${event.location}\n\n`
      message += `🧭 *ניווט לאירוע:*\n`
      message += `🚗 Waze:\n`
      message += `https://waze.com/ul?q=${encodeURIComponent(event.location)}&navigate=yes\n\n`
      message += `🚌 Moovit:\n`
      message += `https://moovitapp.com/?to=${encodeURIComponent(event.location)}&metropolis=israel\n\n`
    }

    // Description
    if (event.description) {
      message += `📝 *פרטים נוספים:*\n`
      message += `${event.description}\n\n`
    }

    // Custom message removed - was redundant with event title

    message += `━━━━━━━━━━━━━━━━\n`
    message += `FamilyNotify - מערכת התראות משפחתית`

    return message
  }

  private getTimeUntilEvent(startsAt: Date): string {
    const now = new Date()
    const start = new Date(startsAt)

    // Check if it's today
    const isToday =
      now.getDate() === start.getDate() &&
      now.getMonth() === start.getMonth() &&
      now.getFullYear() === start.getFullYear()

    // Check if it's tomorrow
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow =
      tomorrow.getDate() === start.getDate() &&
      tomorrow.getMonth() === start.getMonth() &&
      tomorrow.getFullYear() === start.getFullYear()

    const tz = 'Asia/Jerusalem'
    const timeString = formatInTimeZone(start, tz, 'HH:mm')

    if (isToday) {
      return `היום בשעה ${timeString}`
    } else if (isTomorrow) {
      return `מחר בשעה ${timeString}`
    } else {
      // Check if it's within the next 6 days (show day name)
      const diffTime = start.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 6) {
        const dayName = formatInTimeZone(start, tz, 'eeee', { locale: he })
        return `ביום ${dayName} בשעה ${timeString}`
      } else {
        // Full date
        const dateString = formatInTimeZone(start, tz, 'd/M')
        return `בתאריך ${dateString} בשעה ${timeString}`
      }
    }
  }
}

export const dispatchService = new DispatchService()
