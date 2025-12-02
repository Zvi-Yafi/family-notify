import Link from 'next/link'

export default function NotFound() {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-3xl font-bold mb-2">404</h1>
              <p className="text-lg text-gray-600 mb-4">הדף שחיפשת לא נמצא</p>
              <p className="text-center text-gray-500 mb-6">
                נראה שהדף שניסית להגיע אליו לא קיים או הועבר למקום אחר.
              </p>
              <div className="flex gap-2 justify-center">
                <Link
                  href="/"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  חזרה לדף הבית
                </Link>
                <Link
                  href="/feed"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  לפיד ההודעות
                </Link>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
