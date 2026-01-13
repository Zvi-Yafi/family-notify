import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function TestAuthPage() {
  const [checks, setChecks] = useState({
    supabaseUrl: false,
    supabaseKey: false,
    supabaseConnection: false,
    googleProvider: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const testAuth = useCallback(async () => {
    try {
      // Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      setChecks((prev) => ({
        ...prev,
        supabaseUrl: !!url && url !== '',
        supabaseKey: !!key && key !== '',
      }))

      if (!url || !key) {
        setError('משתני סביבה חסרים - NEXT_PUBLIC_SUPABASE_URL או NEXT_PUBLIC_SUPABASE_ANON_KEY')
        setLoading(false)
        return
      }

      // Test Supabase connection
      const supabase = createClient()
      const { data, error: connError } = await supabase.auth.getSession()

      setChecks((prev) => ({
        ...prev,
        supabaseConnection: !connError,
      }))

      if (connError) {
        setError(`שגיאת חיבור ל-Supabase: ${connError.message}`)
      }

      // Check if Google provider is configured
      // This is a basic check - actual configuration needs to be done in Supabase dashboard
      setChecks((prev) => ({
        ...prev,
        googleProvider: true, // Will be true if OAuth flow works
      }))
    } catch (err: any) {
      setError('אירעה שגיאה כללית בבדיקת המערכת. אנא וודא שהשרת פועל.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    testAuth()
  }, [testAuth])

  const testGoogleLogin = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        alert(`שגיאה בהתחברות: לא הצלחנו להשלים את ההתחברות עם Google.`)
      }
    } catch (err: any) {
      alert(`שגיאה: לא הצלחנו ליצור קשר עם שירותי האימות.`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🔍 בדיקת מערכת Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p>בודק...</p>
            ) : (
              <>
                <div className="space-y-3">
                  <CheckItem
                    label="NEXT_PUBLIC_SUPABASE_URL מוגדר"
                    passed={checks.supabaseUrl}
                    value={process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'}
                  />
                  <CheckItem
                    label="NEXT_PUBLIC_SUPABASE_ANON_KEY מוגדר"
                    passed={checks.supabaseKey}
                    value={checks.supabaseKey ? '✓ מוגדר' : '✗ לא מוגדר'}
                  />
                  <CheckItem label="חיבור ל-Supabase" passed={checks.supabaseConnection} />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
                    <AlertCircle className="inline h-5 w-5 ml-2" />
                    {error}
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-bold mb-2">בדיקת Google OAuth:</h3>
                  <Button onClick={testGoogleLogin}>נסה להתחבר עם Google</Button>
                  <p className="text-sm text-gray-600 mt-2">
                    אם זה לא עובד, תראה את השגיאה המדויקת
                  </p>
                </div>

                <div className="border-t pt-4 mt-4 bg-blue-50 p-4 rounded">
                  <h3 className="font-bold mb-2">📋 צעדים להגדרה:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      <strong>Google Cloud Console:</strong> צור OAuth 2.0 Client
                      <br />
                      <code className="text-xs bg-white px-2 py-1 rounded">
                        https://console.cloud.google.com
                      </code>
                    </li>
                    <li>
                      <strong>הוסף Redirect URI:</strong>
                      <br />
                      <code className="text-xs bg-white px-2 py-1 rounded">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback
                      </code>
                    </li>
                    <li>
                      <strong>Supabase Dashboard:</strong> הפעל Google Provider
                      <br />
                      Authentication → Providers → Google → הזן Client ID & Secret
                    </li>
                  </ol>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CheckItem({ label, passed, value }: { label: string; passed: boolean; value?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
      {passed ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600" />
      )}
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {value && <p className="text-sm text-gray-600">{value}</p>}
      </div>
    </div>
  )
}
