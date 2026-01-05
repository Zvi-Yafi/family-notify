import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TermsPage() {
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
            <CardTitle className="text-3xl">תנאי שימוש</CardTitle>
            <CardDescription>עודכן לאחרונה: נובמבר 2025</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-rtl dark:prose-invert max-w-none">
            <h2>1. קבלת התנאים</h2>
            <p>
              בשימוש בשירות FamilyNotify, אתה מסכים לתנאים אלה. אם אינך מסכים, אנא אל תשתמש בשירות.
            </p>

            <h2>2. תיאור השירות</h2>
            <p>
              FamilyNotify היא פלטפורמה לשליחת הודעות ואירועים משפחתיים דרך ערוצים מרובים (Email,
              SMS, WhatsApp, Web Push). השירות מיועד לשימוש אישי ומשפחתי בלבד.
            </p>

            <h2>3. רישום וחשבון</h2>
            <ul>
              <li>עליך לספק מידע מדויק ועדכני</li>
              <li>אתה אחראי על שמירת סודיות החשבון שלך</li>
              <li>גיל מינימום לשימוש: 13 שנים</li>
              <li>חשבון אחד לכל משתמש</li>
            </ul>

            <h2>4. שימוש מותר</h2>
            <p>אתה מתחייב:</p>
            <ul>
              <li>לא לשלוח ספאם או תוכן לא רצוי</li>
              <li>לא לשלוח תוכן פוגעני, מעליב או בלתי חוקי</li>
              <li>לכבד את העדפות הקבלה של חברי הקבוצה</li>
              <li>לא לנצל את השירות למטרות מסחריות ללא אישור</li>
              <li>לא לנסות לפרוץ או להזיק למערכת</li>
            </ul>

            <h2>5. תוכן משתמש</h2>
            <p>
              אתה שומר על כל הזכויות לתוכן שאתה שולח. אנו לא אחראים לתוכן שנשלח על ידי משתמשים. אנו
              שומרים לעצמנו את הזכות להסיר תוכן הפוגע בתנאים אלה.
            </p>

            <h2>6. קבוצות משפחתיות</h2>
            <ul>
              <li>מנהל קבוצה אחראי על התוכן שנשלח בקבוצה</li>
              <li>חברי קבוצה יכולים לעזוב בכל עת</li>
              <li>מנהל יכול להסיר חברים או למחוק את הקבוצה</li>
            </ul>

            <h2>7. עלויות ותשלומים</h2>
            <p>השירות הבסיסי חינמי. ייתכנו עלויות עבור:</p>
            <ul>
              <li>שליחת SMS (עלות ספק חיצוני)</li>
              <li>שליחת WhatsApp (לפי מדיניות Meta)</li>
              <li>תכונות פרימיום בעתיד</li>
            </ul>

            <h2>8. הגבלת אחריות</h2>
            <p>השירות ניתן &quot;כמות שהוא&quot; (AS IS). איננו מבטיחים:</p>
            <ul>
              <li>זמינות רציפה של השירות</li>
              <li>הגעה מובטחת של כל הודעה</li>
              <li>שהשירות יהיה נטול שגיאות</li>
            </ul>
            <p>לא נהיה אחראים לנזקים ישירים או עקיפים הנובעים משימוש בשירות.</p>

            <h2>9. הפסקת שירות</h2>
            <p>אנו שומרים לעצמנו את הזכות:</p>
            <ul>
              <li>להשעות או לסגור חשבונות שמפרים תנאים אלה</li>
              <li>להפסיק את השירות בכל עת עם הודעה מראש</li>
              <li>לשנות תכונות או מחירים</li>
            </ul>

            <h2>10. קניין רוחני</h2>
            <p>
              כל הזכויות ב-FamilyNotify (קוד, עיצוב, לוגו) שייכות לנו. אסור להעתיק או לשכפל את
              השירות ללא רשות.
            </p>

            <h2>11. שינויים בתנאים</h2>
            <p>
              אנו עשויים לעדכן תנאים אלה. נודיע לך על שינויים משמעותיים. המשך שימוש לאחר שינוי מהווה
              הסכמה לתנאים החדשים.
            </p>

            <h2>12. דין וסמכות שיפוט</h2>
            <p>תנאים אלה כפופים לדיני מדינת ישראל. סמכות השיפוט הייחודית תהיה לבתי המשפט בישראל.</p>

            <h2>13. יצירת קשר</h2>
            <p>
              לשאלות על תנאי השימוש:
              <br />
              <a href="mailto:familynotifys@gmail.com">familynotifys@gmail.com</a>
            </p>

            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm">
                <strong>תזכורת:</strong> השירות נועד לשמח ולחבר משפחות. השתמשו בו באחריות ובכבוד!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
