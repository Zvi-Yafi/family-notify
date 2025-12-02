'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50 to-white">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold mb-2">שגיאה</h1>
              <p className="text-muted-foreground mb-6">משהו השתבש. אנחנו עובדים על זה.</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                נסה שוב
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
