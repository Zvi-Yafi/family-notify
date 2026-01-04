'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/hooks/use-auth'
import { Header } from '@/components/header'

export default function TestWhatsAppPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    error?: string
  } | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין מספר טלפון',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: `הודעת WhatsApp נשלחה בהצלחה! Message ID: ${data.messageId}`,
        })
        toast({
          title: 'WhatsApp נשלח! ✅',
          description: 'בדוק את WhatsApp שלך',
        })
      } else {
        setResult({
          success: false,
          error: data.error || 'שגיאה בשליחת ה-WhatsApp',
        })
        toast({
          title: 'שגיאה',
          description: data.error || 'לא הצלחנו לשלוח את ה-WhatsApp',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'שגיאה בשליחת ה-WhatsApp',
      })
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לשלוח את ה-WhatsApp',
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
                <MessageSquare className="h-6 w-6 text-green-600" />
                <CardTitle>בדיקת שליחת WhatsApp</CardTitle>
              </div>
              <CardDescription>בדוק שההגדרות של Green API עובדות נכון</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTest} className="space-y-4">
                <div>
                  <Label htmlFor="phone">מספר טלפון לבדיקה</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+972-50-1234567 או 0501234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    פורמט: +972-50-1234567 או 0501234567 (ללא רווחים)
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 ml-2" />
                      שלח הודעת WhatsApp בדיקה
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
                        <p className="text-xs text-gray-500 mt-2">בדוק את WhatsApp של {phone}</p>
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
                        {result.error?.includes('not configured') && (
                          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              ⚠️ WhatsApp לא מוגדר
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                              הוסף את המשתנים הבאים ל-.env.local:
                            </p>
                            <code className="text-xs block mt-2 bg-white p-2 rounded">
                              GREEN_API_ID_INSTANCE=&quot;...&quot;
                              <br />
                              GREEN_API_TOKEN_INSTANCE=&quot;...&quot;
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">📋 מה לבדוק:</h3>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>✅ ההודעה הגיעה ל-WhatsApp</li>
                  <li>✅ התוכן נכון (עברית)</li>
                  <li>✅ המספר נכון</li>
                  <li>✅ אין שגיאות בקונסול</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
