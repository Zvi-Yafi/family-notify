import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, MessageSquare, Bell, Calendar, Users, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Bell className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">FamilyNotify</h1>
          </div>
          <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">התחברות</Link>
              </Button>
              <Button asChild>
                <Link href="/login">התחל כאן</Link>
              </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold mb-6">
          שמרו על קשר עם כל המשפחה
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          פלטפורמה מתקדמת לשליחת הודעות, שמחות ואירועים לכל המשפחה.
          כל אחד בוחר איך לקבל - אימייל, SMS, WhatsApp או התראות.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/onboarding">התחילו עכשיו - חינם</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">למד עוד</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">תכונות עיקריות</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Mail className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>ערוצים מרובים</CardTitle>
              <CardDescription>
                שלחו הודעות דרך אימייל, SMS, WhatsApp או התראות אינטרנט
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>קבוצות משפחתיות</CardTitle>
              <CardDescription>
                נהלו מספר קבוצות משפחתיות עם הרשאות גמישות
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>לוח אירועים</CardTitle>
              <CardDescription>
                תזכורות אוטומטיות לימי הולדת, חתונות ואירועים משפחתיים
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>הודעות מתוזמנות</CardTitle>
              <CardDescription>
                שלחו הודעות מיידיות או תזמנו לעתיד
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-red-600 mb-2" />
              <CardTitle>פרטיות ושליטה</CardTitle>
              <CardDescription>
                כל משתמש שולט איך ומתי לקבל הודעות
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-10 w-10 text-indigo-600 mb-2" />
              <CardTitle>התראות חכמות</CardTitle>
              <CardDescription>
                מערכת תזכורות אוטומטית לאירועים חשובים
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">איך זה עובד?</h3>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">הרשמו ויצרו קבוצה</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  הצטרפו למשפחה קיימת או צרו קבוצה חדשה עם שם ייחודי
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">בחרו העדפות קבלה</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  כל אחד מחליט דרך איזה ערוצים לקבל הודעות ומאמת את הפרטים
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">שלחו ותזמנו הודעות</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  מנהלים יכולים לפרסם הודעות ואירועים, והמערכת דואגת לשלוח לכולם
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-3xl font-bold mb-4">מוכנים להתחיל?</h3>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          הצטרפו עכשיו בחינם וקשרו את כל המשפחה
        </p>
        <Button size="lg" asChild>
          <Link href="/onboarding">התחילו עכשיו</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400">
              © 2025 FamilyNotify. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/legal/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900">
                מדיניות פרטיות
              </Link>
              <Link href="/legal/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900">
                תנאי שימוש
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


