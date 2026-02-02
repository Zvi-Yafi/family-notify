import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function TestNetworkError() {
  const testSupabaseError = () => {
    const originalEnv = { ...process.env }
    delete (process.env as any).NEXT_PUBLIC_SUPABASE_URL
    delete (process.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
      const { createClient } = require('@/lib/supabase/client')
      createClient()
    } catch (error: any) {
      console.error('Caught error:', error)
      throw error
    } finally {
      process.env = originalEnv as any
    }
  }

  const testNetworkBlockedError = () => {
    const error = new Error('NETWORK_BLOCKED')
    error.name = 'NetworkBlockedError'
    throw error
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-3xl font-bold text-center mb-8">בדיקת טיפול בשגיאות רשת</h1>

        <div className="space-y-4">
          <Button onClick={testSupabaseError} className="w-full" variant="destructive">
            בדיקה: שגיאת Supabase חסר
          </Button>

          <Button onClick={testNetworkBlockedError} className="w-full" variant="destructive">
            בדיקה: שגיאת חסימת רשת
          </Button>

          <Button onClick={() => (window.location.href = '/')} className="w-full" variant="outline">
            חזרה לדף הבית
          </Button>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
          <p className="font-semibold mb-2">הוראות שימוש:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>לחץ על אחד מכפתורי הבדיקה</li>
            <li>אמור לראות את מסך השגיאה המפורט עם הנחיות לפתרון VPN</li>
            <li>בדוק שהמסך מציג את כל המידע הנדרש</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
