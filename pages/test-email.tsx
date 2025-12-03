'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/hooks/use-auth'
import { Header } from '@/components/header'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כתובת אימייל',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: `אימייל נשלח בהצלחה! Message ID: ${data.messageId}`,
        })
        toast({
          title: 'אימייל נשלח! ✅',
          description: 'בדוק את תיבת הדואר הנכנס',
        })
      } else {
        setResult({
          success: false,
          error: data.error || 'שגיאה בשליחת האימייל',
        })
        toast({
          title: 'שגיאה',
          description: data.error || 'לא הצלחנו לשלוח את האימייל',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'שגיאה בשליחת האימייל',
      })
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לשלוח את האימייל',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-6 w-6 text-blue-600" />
                <CardTitle>בדיקת שליחת אימייל</CardTitle>
              </div>
              <CardDescription>
                בדוק שההגדרות של Resend עובדות נכון
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTest} className="space-y-4">
                <div>
                  <Label htmlFor="email">כתובת אימייל לבדיקה</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                  {user && (
                    <p className="text-sm text-gray-500 mt-1">
                      נשלח מ: {user.email}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 ml-2" />
                      שלח אימייל בדיקה
                    </>
                  )}
                </Button>
              </form>

              {result && (
                <div className="mt-6 p-4 rounded-lg border">
                  {result.success ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-600">הצלחה!</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          בדוק את תיבת הדואר הנכנס (וגם spam) של {email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-600">שגיאה</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.error}
                        </p>
                        {result.error?.includes('testing emails') && (
                          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              ⚠️ בעיית Resend Testing Mode
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                              הוסף את {email} ל-Allowed Recipients ב-Resend dashboard
                            </p>
                            <a
                              href="https://resend.com/emails"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 underline mt-2 inline-block"
                            >
                              פתח Resend Dashboard →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">📋 מה לבדוק:</h3>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>✅ האימייל הגיע לתיבת הדואר הנכנס</li>
                  <li>✅ האימייל לא נכנס ל-spam</li>
                  <li>✅ התוכן נכון (עברית, RTL)</li>
                  <li>✅ ה-From address נכון</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

