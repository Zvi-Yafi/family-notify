import { prisma } from '@/lib/prisma'
import { emailProvider } from '@/lib/providers/email.provider'
import { pushProvider } from '@/lib/providers/push.provider'
import { smsProvider } from '@/lib/providers/sms.provider'
import { whatsAppProvider } from '@/lib/providers/whatsapp.provider'
import { CommunicationChannel, DeliveryStatus } from '@prisma/client'
import { formatInTimeZone } from 'date-fns-tz'
import { he } from 'date-fns/locale'
import { getHebrewDateString, getFullHebrewDate } from '@/lib/utils/hebrew-date-utils'
import {
  buildEmailHtml,
  buildEventReminderHtml,
  buildWelcomeEmailHtml,
} from '@/lib/utils/email-templates'

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
      const userName =
        membership.user.name ||
        (membership.user.email ? membership.user.email.split('@')[0] : membership.user.phone) ||
        'משתמש'
      const contact = membership.user.email || membership.user.phone || 'ללא פרטי קשר'
      console.log(`\n👤 שולח ל-${userName} (${contact})...`)

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
          const userContact = membership.user.email || membership.user.phone || membership.user.id
          console.log(`⏭️  Skipping ${preference.channel} for ${userContact} - not verified`)
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
            html: buildEmailHtml(announcement, user),
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
          ? `אירוע חדש: ${event.title}${event.location ? ` ב${event.location}` : ''}`
          : `תזכורת: ${event.title}${event.location ? ` ב${event.location}` : ''}`)

      let result: { success: boolean; messageId?: string; error?: string }

      switch (preference.channel) {
        case 'EMAIL':
          result = await emailProvider.send({
            to: preference.destination,
            subject,
            html: buildEventReminderHtml(
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

      const userContact = user.email || user.phone || user.id
      if (result.success) {
        console.log(`✅ Sent event reminder via ${preference.channel} to ${userContact}`)
      } else {
        console.error(
          `❌ Failed event reminder via ${preference.channel} to ${userContact}: ${result.error}`
        )
      }
    } catch (error: any) {
      const userContact = user.email || user.phone || user.id
      console.error(`❌ Error sending event reminder to ${userContact}:`, error)
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

  /**
   * Send a welcome notification to a new member
   */
  async dispatchWelcomeNotification(
    user: any,
    familyGroup: any,
    channel: CommunicationChannel,
    password?: string
  ): Promise<void> {
    const siteLink = `${process.env.NEXT_PUBLIC_APP_URL}/`
    const userName = user.name || (user.email ? user.email.split('@')[0] : user.phone) || 'משתמש'
    const groupName = familyGroup.name
    const userContact = user.email || user.phone || 'ללא פרטי קשר'

    console.log(`\n👋 שולח הודעת ברוך הבא ל-${userName} (${userContact}) בקבוצת ${groupName}`)

    try {
      let result: { success: boolean; messageId?: string; error?: string }

      // Get the preference for the selected channel
      const preference = await prisma.preference.findUnique({
        where: {
          userId_channel: {
            userId: user.id,
            channel: channel,
          },
        },
      })

      if (!preference) {
        console.error(`❌ לא נמצאה העדפה עבור ערוץ ${channel} למשתמש ${user.id}`)
        return
      }

      switch (channel) {
        case 'EMAIL':
          if (!preference.destination && !user.email) {
            console.error(`❌ אין כתובת מייל למשתמש ${user.id}`)
            return
          }
          result = await emailProvider.send({
            to: preference.destination || user.email!,
            subject: `ברוך הבא ל-FamilyNotify - הצטרפת לקבוצת ${groupName}`,
            html: buildWelcomeEmailHtml(userName, groupName, siteLink, password),
            text: `היי ${userName}! ברוך הבא לקבוצת ${groupName} ב-FamilyNotify. כנס לאתר: ${siteLink}${password ? `\nפרטי התחברות:\nמייל: המייל שלך\nסיסמה: ${password}` : ''}`,
          })
          break

        case 'WHATSAPP':
          if (!preference.destination && !user.phone) {
            console.error(`❌ אין מספר טלפון למשתמש ${user.id}`)
            return
          }
          const whatsappMessage = `👋 *היי ${userName}!* \n\nברוך הבא לקבוצת *${groupName}* ב-FamilyNotify. \nמנהל הקבוצה צירף אותך כדי שתוכל להישאר מעודכן בכל מה שקורה במשפחה. \n\n${password ? `🔐 *פרטי התחברות:* \n📧 מייל: המייל שלך \n🔑 סיסמה: *${password}* \n\n` : ''}כניסה לאתר: ${siteLink} \n\n━━━━━━━━━━━━━━━━\nFamilyNotify`
          result = await whatsAppProvider.send({
            to: preference.destination || user.phone!,
            message: whatsappMessage,
          })
          break

        case 'SMS':
          const smsMessage = `היי ${userName}! ברוך הבא ל-${groupName} ב-FamilyNotify. כנס: ${siteLink}${password ? ` עובר ל: ססמה: ${password}` : ''}`
          result = await smsProvider.send({
            to: preference.destination || user.phone,
            message: smsMessage,
          })
          break

        default:
          console.warn(`⚠️ ערוץ ${channel} לא נתמך להודעת ברוך הבא`)
          return
      }

      if (result.success) {
        console.log(`✅ הודעת ברוך הבא נשלחה בהצלחה ב-${channel}`)
      } else {
        console.error(`❌ שגיאה בשליחת הודעת ברוך הבא ב-${channel}: ${result.error}`)
      }
    } catch (error: any) {
      console.error(`❌ שגיאה לא צפויה בשליחת הודעת ברוך הבא: ${error.message}`)
    }
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
        return `מתי: ${dayName} בשעה ${timeString}`
      } else {
        // Full date
        const dateString = formatInTimeZone(start, tz, 'd/M')
        return `בתאריך ${dateString} בשעה ${timeString}`
      }
    }
  }
}

export const dispatchService = new DispatchService()
