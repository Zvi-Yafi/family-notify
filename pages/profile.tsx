import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { createClient } from '@/lib/supabase/client'
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
import { User, Phone, Mail, Save, ArrowRight, Trash2, AlertTriangle, X } from 'lucide-react'
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

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

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true)
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'נכשל במחיקת החשבון')
      }

      toast({
        title: 'להתראות!',
        description: 'חשבונך נמחק לצמיתות מהמערכת.',
      })

      // 1. Sign out from Supabase to clear local session/cookies
      const supabase = createClient()
      await supabase.auth.signOut()

      // 2. Clear context/localStorage potentially (though signOut should do most)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('familyGroupId')
        localStorage.removeItem('userId')
      }

      // 3. Redirect to home/login
      router.push('/login?message=deleted')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast({
        title: 'שגיאה',
        description: error.message || 'לא הצלחנו למחוק את החשבון.',
        variant: 'destructive',
      })
      setDeletingAccount(false)
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

            {/* Danger Zone */}
            <div className="mt-12 pt-8 border-t border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2 mb-4 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-bold italic">אזור מסוכן - Danger Zone</h3>
              </div>

              <Card className="border border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-800 dark:text-red-400">
                    מחיקת חשבון
                  </CardTitle>
                  <CardDescription className="text-red-600/70 dark:text-red-400/60">
                    פעולה זו היא לצמיתות ולא ניתן לבטל אותה. כל המידע שלך, הקבוצות, וההודעות שפרסמת
                    יימחקו מהמערכת.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showDeleteConfirm ? (
                    <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-red-200 dark:border-red-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-sm font-bold text-red-800 dark:text-red-300 mb-4">
                        אתה בטוח לגמרי? כל התוכן שלך יימחק.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="destructive"
                          className="h-10 px-6 font-bold bg-red-600 hover:bg-red-700"
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount}
                        >
                          {deletingAccount ? 'מוחק...' : 'כן, מחק את החשבון שלי'}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-10 px-6"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deletingAccount}
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-600 hover:text-white transition-all rounded-xl gap-2"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      מחק חשבון לצמיתות
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
