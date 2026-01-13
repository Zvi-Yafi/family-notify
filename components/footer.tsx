import Link from 'next/link'
import { Logo } from './logo'
import { Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8 p-1.5" />
              <span className="text-xl font-bold">FamilyNotify</span>
            </div>
            <p className="text-slate-500 text-center md:text-right max-w-sm">
              הדרך הקלה והמכובדת ביותר לשמור על קשר משפחתי הדוק ומסודר.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 font-medium">
            <Link href="/#about" className="hover:text-blue-600 transition-colors">
              אודות
            </Link>
            <Link href="/#features" className="hover:text-blue-600 transition-colors">
              תכונות
            </Link>
            <Link href="/#contact" className="hover:text-blue-600 transition-colors">
              צור קשר
            </Link>
            <Link
              href="https://famnotify.com/legal/privacy"
              className="hover:text-blue-600 transition-colors font-bold text-blue-700 dark:text-blue-400"
            >
              מדיניות פרטיות (Privacy Policy)
            </Link>
            <Link href="/legal/terms" className="hover:text-blue-600 transition-colors">
              תנאי שימוש
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} FamilyNotify. כל הזכויות שמורות.</p>
          <div className="flex gap-4">
            <p className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for families
              everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
