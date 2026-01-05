import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Phone, Mail, Save, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Footer } from '@/components/footer'

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.getProfile()
        if (response.user) {
          setFormData({
            name: response.user.name || '',
            phone: response.user.phone || '',
            email: response.user.email || '',
          })
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error)
        if (error.name === 'UnauthorizedError') return // Handled by apiClient
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לטעון את פרטי הפרופיל',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await apiClient.updateProfile(formData)
      toast({
        title: 'הפרופיל עודכן! ✅',
        description: 'הפרטים שלך נשמרו בהצלחה במערכת.',
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: 'שגיאה בעדכון',
        description: error.message || 'לא הצלחנו לעדכן את הפרטים.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
            <div className="h-64 w-full max-w-md bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-8 transition-colors group"
          >
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            חזרה לפיד
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-none shadow-xl shadow-blue-500/5 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              <CardHeader className="pt-8 px-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">עריכת פרופיל</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                      עדכן את הפרטים האישיים שלך ליצירת קשר נוחה יותר במערכת.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 px-8 py-6">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      שם מלא
                    </Label>
                    <Input
                      id="name"
                      placeholder="הכנס שם מלא"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 rounded-xl"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-semibold flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4 text-gray-400" />
                      מספר טלפון
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      dir="ltr"
                      placeholder="050-1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 rounded-xl text-right"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 text-gray-400" />
                      כתובת אימייל
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      dir="ltr"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 rounded-xl text-right"
                    />
                    <p className="text-[11px] text-gray-400 mt-1 mr-1">
                      * שינוי המייל משפיע על קבלת התראות וזיהוי המשתמש.
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50/50 dark:bg-gray-800/20 px-8 py-6 flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto min-w-[140px] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-70"
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        שומר...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        שמור שינויים
                      </div>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    asChild
                    className="w-full sm:w-auto h-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                  >
                    <Link href="/preferences">ניהול העדפות התראה</Link>
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
