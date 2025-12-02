import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/">← חזרה לדף הבית</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">מדיניות פרטיות</CardTitle>
            <CardDescription>עודכן לאחרונה: נובמבר 2025</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-rtl dark:prose-invert max-w-none">
            <h2>1. מבוא</h2>
            <p>
              ברוכים הבאים ל-FamilyNotify. אנו מחויבים להגן על פרטיותך ולנהל את המידע האישי שלך
              באופן אחראי. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך.
            </p>

            <h2>2. איזה מידע אנו אוספים</h2>
            <p>אנו אוספים את סוגי המידע הבאים:</p>
            <ul>
              <li>
                <strong>מידע אישי</strong>: כתובת אימייל, מספר טלפון (אופציונלי)
              </li>
              <li>
                <strong>מידע על העדפות</strong>: ערוצי קבלה מועדפים (Email, SMS, WhatsApp, Push)
              </li>
              <li>
                <strong>מידע על שימוש</strong>: לוגים של שליחות, זמני גישה למערכת
              </li>
              <li>
                <strong>קבוצות משפחתיות</strong>: חברות בקבוצות, תפקידים
              </li>
            </ul>

            <h2>3. כיצד אנו משתמשים במידע</h2>
            <p>אנו משתמשים במידע שלך כדי:</p>
            <ul>
              <li>לשלוח לך הודעות ואירועים משפחתיים</li>
              <li>לנהל את ההעדפות שלך לקבלת הודעות</li>
              <li>לאמת את זהותך ואת ערוצי התקשורת</li>
              <li>לשפר את השירות ולתקן בעיות טכניות</li>
              <li>לעמוד בדרישות חוקיות</li>
            </ul>

            <h2>4. שיתוף מידע</h2>
            <p>
              אנו <strong>לא משתפים</strong> את המידע האישי שלך עם צדדים שלישיים למטרות שיווקיות.
              אנו משתפים מידע רק:
            </p>
            <ul>
              <li>עם חברי הקבוצה המשפחתית שלך (רק שם ופרטי קשר בסיסיים)</li>
              <li>עם ספקי שירות (Supabase, Resend, Twilio) לצורך הפעלת השירות</li>
              <li>כאשר נדרש על פי חוק</li>
            </ul>

            <h2>5. אבטחת מידע</h2>
            <p>אנו משתמשים באמצעי אבטחה מתקדמים:</p>
            <ul>
              <li>הצפנת נתונים בשידור (HTTPS/TLS)</li>
              <li>Row Level Security (RLS) בבסיס הנתונים</li>
              <li>אימות דו-שלבי לפעולות רגישות</li>
              <li>גיבויים קבועים</li>
            </ul>

            <h2>6. הזכויות שלך</h2>
            <p>יש לך את הזכות:</p>
            <ul>
              <li>
                <strong>לגשת</strong> למידע האישי שלך
              </li>
              <li>
                <strong>לתקן</strong> מידע שגוי
              </li>
              <li>
                <strong>למחוק</strong> את החשבון והמידע שלך
              </li>
              <li>
                <strong>לייצא</strong> את המידע שלך (Data Portability)
              </li>
              <li>
                <strong>לבטל</strong> את ההסכמה לשליחת הודעות בכל עת
              </li>
            </ul>

            <h2>7. עוגיות (Cookies)</h2>
            <p>
              אנו משתמשים בעוגיות טכניות הכרחיות לתפעול המערכת (אימות, העדפות). אין לנו עוגיות
              שיווקיות או מעקב צד שלישי.
            </p>

            <h2>8. עדכונים למדיניות</h2>
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת. נודיע לך על שינויים משמעותיים באימייל או הודעה
              במערכת.
            </p>

            <h2>9. יצירת קשר</h2>
            <p>
              לשאלות על מדיניות הפרטיות, צרו איתנו קשר:
              <br />
              <a href="mailto:privacy@familynotify.com">privacy@familynotify.com</a>
            </p>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm">
                <strong>GDPR Compliance:</strong> אנו מחויבים לעקרונות ה-GDPR ומכבדים את זכויות
                המשתמשים באיחוד האירופי.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
