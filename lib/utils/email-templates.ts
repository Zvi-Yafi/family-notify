import { formatInTimeZone } from 'date-fns-tz'
import { he } from 'date-fns/locale'
import { getFullHebrewDate } from '@/lib/utils/hebrew-date-utils'

// Design Tokens (based on provided HTML)
const COLORS = {
  primary: '#0f4d5c',
  backgroundLight: '#f9f7f6',
  backgroundDark: '#19212e',
  accent: '#E67A60',
  white: '#ffffff',
  textMain: '#121617',
  textSecondary: '#666666',
  border: '#e5e7eb',
}

const FONTS = `'Manrope', 'Arial', sans-serif`

const BASE_STYLES = {
  body: `margin: 0; padding: 0; font-family: ${FONTS}; background-color: ${COLORS.backgroundLight}; color: ${COLORS.textMain}; direction: rtl; min-width: 100%; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;`,
  container: `max-width: 640px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); width: 100%; box-sizing: border-box;`,
  header: `background-color: ${COLORS.white}; padding: 20px 30px; border-bottom: 1px solid ${COLORS.border}; display: flex; align-items: center; justify-content: space-between;`,
  logoText: `color: ${COLORS.primary}; font-size: 18px; font-weight: 700; text-decoration: none;`,
  hero: `width: 100%; max-width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;`,
  contentPadding: `padding: 40px 32px;`,
  tag: `display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: rgba(15, 77, 92, 0.1); color: ${COLORS.primary}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;`,
  h1: `color: ${COLORS.textMain}; font-size: 28px; font-weight: 800; line-height: 1.2; margin: 0 0 24px 0;`,
  section: `padding: 24px 0; border-top: 1px solid ${COLORS.backgroundLight};`,
  rowIconContainer: `width: 48px; height: 48px; border-radius: 50%; background-color: ${COLORS.backgroundLight}; text-align: center; line-height: 48px; margin-left: 16px;`,
  rowIcon: `font-size: 24px; line-height: 1;`,
  label: `display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px; margin-bottom: 4px;`,
  value: `display: block; font-size: 16px; font-weight: 500; color: ${COLORS.textMain};`,
  paragraph: `font-size: 14px; line-height: 1.6; color: ${COLORS.textSecondary}; margin-bottom: 16px;`,
  button: `display: inline-block; background-color: ${COLORS.primary}; color: ${COLORS.white}; padding: 16px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; text-align: center;`,
  secondaryButton: `display: inline-block; color: ${COLORS.textSecondary}; font-size: 12px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; margin-top: 16px;`,
  footer: `background-color: ${COLORS.backgroundLight}; padding: 32px; text-align: center; font-size: 12px; color: ${COLORS.textSecondary};`,
  link: `color: ${COLORS.primary}; text-decoration: underline;`,
}

function linkify(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" style="color: ${COLORS.primary}; text-decoration: underline; word-break: break-all;">${url}</a>`
  })
}

interface CommonEmailProps {
  previewText?: string
}

export function buildEventReminderHtml(
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
  const tagText = isInitial ? 'הזמנה חדשה' : 'תזכורת לאירוע'

  let formattedEndTime = ''
  if (event.endsAt) {
    const eventEndsAt = event.endsAt instanceof Date ? event.endsAt : new Date(event.endsAt)
    formattedEndTime = formatInTimeZone(eventEndsAt, tz, 'HH:mm')
  }

  const timeString = formattedEndTime ? `${formattedTime} - ${formattedEndTime}` : formattedTime

  const mapLinkWaze = `https://waze.com/ul?q=${encodeURIComponent(event.location || '')}&navigate=yes`
  const mapLinkGoogle = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || '')}`

  const heroImageHtml = event.imageUrl
    ? `<img src="${event.imageUrl}" alt="Event Image" style="${BASE_STYLES.hero}" />`
    : ''

  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${event.title}</title>
      <style>
        * { box-sizing: border-box; }
        .hover-opacity:hover { opacity: 0.9; }
        @media only screen and (max-width: 600px) {
          .content-padding { padding: 20px !important; }
          .header-padding { padding: 15px !important; }
        }
      </style>
    </head>
    <body style="${BASE_STYLES.body}">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; background-color: ${COLORS.backgroundLight}; padding: 40px 0;">
        <tr>
          <td align="center">
            
            <!-- Main Card -->
            <div style="${BASE_STYLES.container}">
              
              <!-- Header REMOVED as per user request -->


              ${heroImageHtml}

              <!-- Title Section -->
              <div class="content-padding" style="padding: 40px 32px 16px 32px; text-align: center;">
                <!-- <span style="${BASE_STYLES.tag}">${tagText}</span> REMOVED as per user request -->
                <h1 style="${BASE_STYLES.h1}">${event.title}</h1>
                ${groupName ? `<p style="margin: 0; color: ${COLORS.textSecondary}; font-weight: 500;">${groupName}</p>` : ''}
              </div>

              <!-- Details Grid -->
              <div style="padding: 0 32px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid ${COLORS.backgroundLight}; border-bottom: 1px solid ${COLORS.backgroundLight};">
                  <tr>
                    <td style="padding: 24px 0; border-bottom: 1px solid ${COLORS.backgroundLight};" width="100%">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="50" valign="top">
                        <tr>
                          <td width="60" valign="top">
                            <div style="${BASE_STYLES.rowIconContainer}">
                                <img src="https://img.icons8.com/ios/50/${COLORS.primary.replace('#', '')}/calendar--v1.png" alt="Calendar" width="24" height="24" style="display: inline-block; border: 0; vertical-align: middle;" />
                            </div>
                          </td>
                          <td>
                            <span style="${BASE_STYLES.label}">תאריך ושעה</span>
                            <span style="${BASE_STYLES.value}">${hebrewDate}</span>
                            <span style="${BASE_STYLES.value}">${formattedDate} • ${timeString}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  ${
                    event.location
                      ? `
                  <tr>
                    <td style="padding: 24px 0;" width="100%">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="60" valign="top">
                            <div style="${BASE_STYLES.rowIconContainer}">
                                <img src="https://img.icons8.com/ios/50/${COLORS.primary.replace('#', '')}/marker--v1.png" alt="Location" width="24" height="24" style="display: inline-block; border: 0; vertical-align: middle;" />
                            </div>
                          </td>
                          <td>
                            <span style="${BASE_STYLES.label}">מיקום</span>
                            <span style="${BASE_STYLES.value}">${event.location}</span>
                            
                            <!-- Navigation Links -->
                            <div style="margin-top: 12px;">
                                <a href="${mapLinkWaze}" style="display: inline-block; background-color: #33ccff; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 8px;">Waze 🚗</a>
                                <a href="${mapLinkGoogle}" style="display: inline-block; background-color: #4285F4; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">Google Maps 🗺️</a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  `
                      : ''
                  }
                </table>
              </div>

              <div style="padding: 32px;">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">פרטים נוספים</h3>
                ${customMessage && customMessage !== event.title ? `<p style="${BASE_STYLES.paragraph}">${customMessage}</p>` : ''}
                ${(event.description || '')
                  .split('\n')
                  .map((line: string) =>
                    line ? `<p style="${BASE_STYLES.paragraph}">${linkify(line)}</p>` : '<br>'
                  )
                  .join('')}
                
                ${
                  event.fileUrl
                    ? `
                  <div style="margin-top: 24px; padding: 16px; background-color: ${COLORS.backgroundLight}; border-radius: 8px;">
                     <p style="margin: 0 0 8px 0; font-weight: 600;">📎 קובץ מצורף</p>
                     <a href="${event.fileUrl}" style="${BASE_STYLES.link}">להורדת הקובץ לחץ כאן</a>
                  </div>
                `
                    : ''
                }

                <!-- CTAs REMOVED as per user request -->
                <!-- 
                <div style="margin-top: 40px; text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" style="${BASE_STYLES.button}">
                    אישור הגעה ביומן
                  </a>
                  <br>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" style="display: inline-block; color: ${COLORS.textSecondary}; font-size: 12px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; margin-top: 16px;">
                    אני לא יכול להגיע
                  </a>
                </div>
                -->
              </div>

              <!-- Footer -->
              <div style="${BASE_STYLES.footer}">
                <p style="margin: 0 0 12px 0;">נשלח על ידי FamilyNotify • ${groupName}</p>
                 <div style="margin-bottom: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences" style="${BASE_STYLES.link}">ניהול התראות</a>
                 </div>
                 <p style="margin: 0; opacity: 0.6;">© ${new Date().getFullYear()} Family Notify</p>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function buildEmailHtml(announcement: any, user: any): string {
  const isSimcha = announcement.type === 'SIMCHA'

  const title = announcement.title
  const body = announcement.body

  // Use a default hero image for announcements if none specific
  // Or just a gradient pattern header

  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        .hover-opacity:hover { opacity: 0.9; }
        @media only screen and (max-width: 600px) {
          .content-padding { padding: 20px !important; }
          .header-padding { padding: 15px !important; }
        }
      </style>
      <title>${title}</title>
    </head>
    <body style="${BASE_STYLES.body}">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; background-color: ${COLORS.backgroundLight}; padding: 40px 0;">
        <tr>
          <td align="center">
            <div style="${BASE_STYLES.container}">
              
              <!-- Header REMOVED as per user request -->


              <!-- Content -->
              <div class="content-padding" style="${BASE_STYLES.contentPadding}; text-align: center;">
                <span style="${BASE_STYLES.tag}">${isSimcha ? 'שמחה במשפחה' : 'הודעה כללית'}</span>
                <h1 style="${BASE_STYLES.h1}">${title}</h1>
                
                <div style="text-align: right; margin-top: 32px;">
                  ${body
                    .split('\n')
                    .map((line: string) =>
                      line
                        ? `<p style="${BASE_STYLES.paragraph}; font-size: 16px;">${linkify(line)}</p>`
                        : '<br>'
                    )
                    .join('')}
                </div>

                <div style="margin-top: 40px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/feed" style="${BASE_STYLES.button}">
                    לצפייה בכל ההודעות
                  </a>
                </div>
              </div>

               <!-- Footer -->
              <div style="${BASE_STYLES.footer}">
                <p style="margin: 0 0 12px 0;">נשלח על ידי FamilyNotify</p>
                 <div style="margin-bottom: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences" style="${BASE_STYLES.link}">ניהול התראות</a>
                 </div>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function buildVerificationEmailHtml(code: string): string {
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>קוד אימות</title>
      <style>
        * { box-sizing: border-box; }
        @media only screen and (max-width: 600px) {
          .content-padding { padding: 20px !important; }
        }
      </style>
    </head>
    <body style="${BASE_STYLES.body}">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; background-color: ${COLORS.backgroundLight}; padding: 40px 0;">
        <tr>
          <td align="center">
            <div style="${BASE_STYLES.container}">
              
              <div style="${BASE_STYLES.header}">
                 <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 24px;">🔐</span>
                  <span style="${BASE_STYLES.logoText}">FamilyNotify</span>
                </div>
              </div>

              <div class="content-padding" style="${BASE_STYLES.contentPadding}; text-align: center;">
                <h1 style="${BASE_STYLES.h1}">קוד האימות שלך</h1>
                <p style="${BASE_STYLES.paragraph}">הזן את הקוד הבא כדי להמשיך:</p>
                
                <div style="background: ${COLORS.backgroundLight}; padding: 24px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: ${COLORS.primary}; margin: 24px 0;">
                  ${code}
                </div>

                <p style="${BASE_STYLES.paragraph}; font-size: 12px;">הקוד תקף ל-10 דקות.</p>
                <p style="${BASE_STYLES.paragraph}; font-size: 12px;">אם לא ביקשת קוד זה, אנא התעלם מהודעה זו.</p>
              </div>

              <div style="${BASE_STYLES.footer}">
                 <p style="margin: 0;">FamilyNotify</p>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function buildInvitationEmailHtml(
  groupName: string,
  inviterName: string,
  inviteLink: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>הזמנה להצטרף לקבוצה</title>
      <style>
        * { box-sizing: border-box; }
        @media only screen and (max-width: 600px) {
          .content-padding { padding: 20px !important; }
        }
      </style>
    </head>
    <body style="${BASE_STYLES.body}">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; background-color: ${COLORS.backgroundLight}; padding: 40px 0;">
        <tr>
          <td align="center">
            <div style="${BASE_STYLES.container}">
              
              <div style="${BASE_STYLES.header}">
                 <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 24px;">👋</span>
                  <span style="${BASE_STYLES.logoText}">FamilyNotify</span>
                </div>
              </div>

              <div class="content-padding" style="${BASE_STYLES.contentPadding}; text-align: center;">
                <span style="${BASE_STYLES.tag}">הזמנה חדשה</span>
                <h1 style="${BASE_STYLES.h1}">הוזמנת להצטרף ל-${groupName}</h1>
                
                <p style="${BASE_STYLES.paragraph}">
                  <strong>${inviterName}</strong> מזמין/ה אותך להצטרף לקבוצה המשפחתית ב-FamilyNotify.
                </p>
                <p style="${BASE_STYLES.paragraph}">
                  הצטרף עכשיו כדי לקבל עדכונים על אירועים, שמחות והודעות חשובות.
                </p>

                <div style="margin-top: 32px;">
                  <a href="${inviteLink}" style="${BASE_STYLES.button}">
                    הצטרף לקבוצה
                  </a>
                </div>
                
                <div style="margin-top: 32px; text-align: right;">
                    <p style="${BASE_STYLES.paragraph}; font-size: 12px; margin-bottom: 4px;">נתקלת בבעיה? העתק את הקישור:</p>
                    <div style="background: ${COLORS.backgroundLight}; padding: 12px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 11px; color: ${COLORS.textSecondary};">
                        ${inviteLink}
                    </div>
                </div>
              </div>

              <div style="${BASE_STYLES.footer}">
                 <p style="margin: 0;">FamilyNotify</p>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function buildWelcomeEmailHtml(
  userName: string,
  groupName: string,
  siteLink: string,
  password?: string
): string {
  const passwordSection = password
    ? `
    <div style="margin: 24px 0; padding: 20px; background-color: ${COLORS.backgroundLight}; border-radius: 8px; border: 1px dashed ${COLORS.primary};">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: ${COLORS.primary};">פרטי ההתחברות שלך:</p>
        <p style="margin: 0; font-size: 16px;"><strong>אימייל:</strong> המייל שבו קיבלת הודעה זו</p>
        <p style="margin: 8px 0 0 0; font-size: 16px;"><strong>סיסמה:</strong> <span style="font-family: monospace; font-size: 20px; letter-spacing: 2px; color: ${COLORS.accent};">${password}</span></p>
    </div>
  `
    : ''

  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ברוך הבא ל-${groupName}</title>
      <style>
        * { box-sizing: border-box; }
        @media only screen and (max-width: 600px) {
          .content-padding { padding: 20px !important; }
        }
      </style>
    </head>
    <body style="${BASE_STYLES.body}">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; background-color: ${COLORS.backgroundLight}; padding: 40px 0;">
        <tr>
          <td align="center">
            <div style="${BASE_STYLES.container}">
              
              <div style="${BASE_STYLES.header}">
                 <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 24px;">🎉</span>
                  <span style="${BASE_STYLES.logoText}">FamilyNotify</span>
                </div>
              </div>

              <div class="content-padding" style="${BASE_STYLES.contentPadding}; text-align: center;">
                <span style="${BASE_STYLES.tag}">ברוך הבא!</span>
                <h1 style="${BASE_STYLES.h1}">היי ${userName}, ברוך הבא ל-${groupName}</h1>
                
                <p style="${BASE_STYLES.paragraph}">
                    מנהל הקבוצה צירף אותך ל-FamilyNotify - המקום שבו המשפחה נשארת מעודכנת.
                </p>
                <p style="${BASE_STYLES.paragraph}">
                    מעכשיו תקבל עדכונים על אירועים, שמחות והודעות חשובות ישירות בערוץ שבחרת.
                </p>

                ${passwordSection}

                <div style="margin-top: 32px;">
                  <a href="${siteLink}" style="${BASE_STYLES.button}">
                    כניסה לאתר
                  </a>
                </div>
                
                <p style="${BASE_STYLES.paragraph}; font-size: 12px; margin-top: 32px;">
                    מומלץ לשנות את הסיסמה לאחר ההתחברות הראשונה תחת דף הפרופיל.
                </p>
              </div>

              <div style="${BASE_STYLES.footer}">
                 <p style="margin: 0;">FamilyNotify • ${groupName}</p>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
