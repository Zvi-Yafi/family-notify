'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Users,
  Shield,
  ArrowRight,
  CheckCircle2,
  Phone,
  Info,
  Heart,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { useAuth } from '@/lib/hooks/use-auth'
import { Logo } from '@/components/logo'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading) return null

  // Get user display name (consistent with header)
  const getUserDisplayName = () => {
    if (!user) return null
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
  }

  const displayName = getUserDisplayName()

  // --- Authenticated Dashboard View ---
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />

        <main className="container mx-auto px-4 py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto space-y-12"
          >
            {/* Personalized Welcome */}
            <motion.section variants={fadeInUp} className="text-right space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                <Heart className="h-4 w-4" />
                <span>טוב לראות אותך שוב</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                שלום, {displayName}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl ml-auto">
                הקבוצה המשפחתית שלך מחכה לעדכונים חדשים. מה נרצה לשתף היום?
              </p>
            </motion.section>

            {/* Quick Actions Grid */}
            <motion.section variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="relative overflow-hidden group border-none shadow-lg bg-white dark:bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-300" />
                <CardHeader className="relative p-8">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center mb-6 shadow-blue-500/20 shadow-xl">
                    <Bell className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl mb-2">פרסום הודעה</CardTitle>
                  <CardDescription className="text-base mb-6">
                    עדכן את כל המשפחה בשמחה חדשה, הודעה כללית או עדכון חשוב.
                  </CardDescription>
                  <Button asChild className="w-fit gap-2">
                    <Link href="/feed">
                      פרסום הודעה <ArrowRight className="h-4 w-4 rotate-180" />
                    </Link>
                  </Button>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden group border-none shadow-lg bg-white dark:bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent group-hover:from-indigo-500/20 transition-all duration-300" />
                <CardHeader className="relative p-8">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center mb-6 shadow-indigo-500/20 shadow-xl">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl mb-2">אירועים קרובים</CardTitle>
                  <CardDescription className="text-base mb-6">
                    צפה בלוח האירועים המשפחתי, ימי הולדת ואירועים שתוזמנו.
                  </CardDescription>
                  <Button variant="outline" asChild className="w-fit gap-2">
                    <Link href="/events">
                      לוח האירועים <ArrowRight className="h-4 w-4 rotate-180" />
                    </Link>
                  </Button>
                </CardHeader>
              </Card>
            </motion.section>

            {/* Stats / Overview hint */}
            <motion.div
              variants={fadeInUp}
              className="bg-slate-900 dark:bg-blue-600 text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-right">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">הצטרפו כבר אלפי משפחות</h3>
                  <p className="text-blue-100">
                    FamilyNotify עוזרת למשפחות להישאר מחוברות בדרך הקלה והנוחה ביותר.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  <Link href="/groups">נהל קבוצות</Link>
                </Button>
              </div>
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            </motion.div>
          </motion.div>
        </main>
      </div>
    )
  }

  // --- Guest Landing Page View ---
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Logo />
            <span className="text-xl font-bold tracking-tight">FamilyNotify</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#about" className="hover:text-blue-600 transition-colors">
              אודות
            </Link>
            <Link href="#features" className="hover:text-blue-600 transition-colors">
              תכונות
            </Link>
            <Link href="#contact" className="hover:text-blue-600 transition-colors">
              צור קשר
            </Link>
          </div>
          <Button asChild className="rounded-full px-6">
            <Link href="/login">התחברות</Link>
          </Button>
        </nav>
      </header>

      <main className="pt-24">
        {/* HERO SECTION */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-6 flex flex-col items-center text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-8 border border-blue-100 dark:border-blue-800"
            >
              <Globe className="h-4 w-4" />
              <span>הדרך החדשה לתקשורת משפחתית</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]"
            >
              מחברים את <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
                כל המשפחה יחד
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mb-12 leading-relaxed"
            >
              פלטפורמה אחת לריכוז כל ההודעות, השמחות והאירועים של המשפחה. כל אחד בוחר איך לקבל את
              העדכון – WhatsApp, SMS או אימייל.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Button
                size="xl"
                asChild
                className="text-lg px-12 py-7 rounded-2xl shadow-xl shadow-blue-600/20"
              >
                <Link href="/login">מתחילים עכשיו - חינם</Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                asChild
                className="text-lg px-12 py-7 rounded-2xl"
              >
                <Link href="#features">גלו עוד</Link>
              </Button>
            </motion.div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/4 right-0 translate-x-1/3 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="space-y-8"
              >
                <div className="h-1 bg-blue-600 w-20 rounded-full" />
                <h2 className="text-4xl font-bold">כמה מילים על המיזם</h2>
                <div className="space-y-4 text-lg text-slate-600 dark:text-slate-400">
                  <p>
                    FamilyNotify נולדה מתוך צורך אמיתי של משפחות גדולות להישאר מעודכנות בנעשה מבלי
                    ללכת לאיבוד בתוך הרעש של קבוצות הווטסאפ האינסופיות.
                  </p>
                  <p>
                    אנחנו מאמינים שהודעות על שמחות, אירועים ועדכונים משפחתיים חשובים צריכים להגיע
                    בצורה מכובדת, ברורה ובזמן הנכון – בדיוק בערוץ שכל בן משפחה מעדיף.
                  </p>
                  <ul className="space-y-3 pt-4">
                    {[
                      'ריכוז כל שמחות המשפחה במקום אחד',
                      'שליטה מלאה של המשתמש על אופן קבלת ההתראות',
                      'תיעוד היסטורי של כל ההודעות והאירועים',
                      'מערכת תזכורות אוטומטית וחכמה',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-square bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl overflow-hidden shadow-2xl relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="h-48 w-48 text-white/20" />
                  </div>
                  <div className="absolute bottom-10 inset-x-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl text-white">
                    <p className="text-2xl font-semibold italic">
                      &quot;הדרך שלנו להישאר ביחד, גם כשאנחנו רחוקים.&quot;
                    </p>
                  </div>
                </div>
                {/* floating card */}
                <div className="absolute -top-10 -right-10 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl hidden md:block">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="font-bold">הודעה נשלחה</span>
                  </div>
                  <p className="text-sm text-slate-500 italic">
                    &quot;יישר כוח! הודעת השמחה הגיעה לכולם&quot;
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-bold">כל מה שצריך לניהול תקשורת משפחתית</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                ריכזנו עבורכם את הכלים המתקדמים ביותר כדי שאף אחד לא יפספס אף עדכון.
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  title: 'ערוצים מרובים',
                  icon: Mail,
                  color: 'text-blue-500',
                  desc: 'שליחה אוטומטית למייל, SMS ו-WhatsApp בהתאמה אישית לכל משתמש.',
                },
                {
                  title: 'לוח אירועים',
                  icon: Calendar,
                  color: 'text-purple-500',
                  desc: 'צפייה נוחה בכל האירועים הקרובים ותזכורות אוטומטיות חכמות.',
                },
                {
                  title: 'הודעות מתוזמנות',
                  icon: MessageSquare,
                  color: 'text-orange-500',
                  desc: 'כתבו את ההודעה עכשיו וקבעו מתי בדיוק היא תישלח לכולם.',
                },
                {
                  title: 'ניהול קבוצות',
                  icon: Users,
                  color: 'text-indigo-500',
                  desc: 'אפשרות לנהל מספר קבוצות (משפחת אבא, משפחת אמא) בממשק אחד.',
                },
                {
                  title: 'פרטיות מוחלטת',
                  icon: Shield,
                  color: 'text-red-500',
                  desc: 'המידע שלכם מוגן ומוצג אך ורק לבני המשפחה המאושרים בקבוצה.',
                },
                {
                  title: 'ממשק ידידותי',
                  icon: Heart,
                  color: 'text-pink-500',
                  desc: 'חוויית משתמש פשוטה ונעימה שמתאימה לכל הגילאים.',
                },
              ].map((f, i) => (
                <motion.div key={i} variants={fadeInUp}>
                  <Card className="h-full border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 group">
                    <CardHeader className="p-8">
                      <div
                        className={`h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${f.color}`}
                      >
                        <f.icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-xl mb-3">{f.title}</CardTitle>
                      <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                        {f.desc}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 bg-blue-600 dark:bg-blue-700 text-white">
          <div className="container mx-auto px-6 text-center mb-20">
            <h2 className="text-4xl font-bold mb-6">איך מתחילים?</h2>
            <p className="text-blue-100 text-xl">3 צעדים פשוטים ואתם מחוברים</p>
          </div>

          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-[28px] inset-x-1/4 h-0.5 border-t-2 border-dashed border-blue-400/50" />

              {[
                {
                  step: '1',
                  title: 'הרשמה ופתיחת קבוצה',
                  desc: 'נרשמים למערכת ובוחרים שם לקבוצה המשפחתית שלכם.',
                },
                {
                  step: '2',
                  title: 'צירוף בני המשפחה',
                  desc: 'מגדירים את מספרי הטלפון והמיילים של כולם ומתחילים לחבר.',
                },
                {
                  step: '3',
                  title: 'שולחים עדכונים',
                  desc: 'מפרסמים הודעה אחת והיא מגיעה לכולם בערוץ שבחרו.',
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative z-10 flex flex-col items-center text-center space-y-6"
                >
                  <div className="h-14 w-14 rounded-full bg-white text-blue-600 flex items-center justify-center text-2xl font-black shadow-xl ring-8 ring-blue-500/50">
                    {s.step}
                  </div>
                  <h3 className="text-2xl font-bold">{s.title}</h3>
                  <p className="text-blue-100/80 text-lg leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-20 text-center">
              <Button
                size="xl"
                variant="secondary"
                asChild
                className="bg-white text-blue-600 hover:bg-blue-50 text-xl px-12 py-8 rounded-3xl font-bold"
              >
                <Link href="/login">אני רוצה להירשם עכשיו!</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 dark:border-slate-800">
              <div className="md:w-1/2 p-12 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-3xl font-bold mb-6">נשמח לשמוע מכם!</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
                  יש לכם שאלות, הצעות לשיפור או שסתם בא לכם להגיד תודה? אנחנו כאן לכל דבר.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">אימייל</div>
                      <div className="font-bold">familynotifys@gmail.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">וואטסאפ לתמיכה</div>
                      <div className="font-bold">0586412420</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Info className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">שעות פעילות</div>
                      <div className="font-bold">א&apos;-ה&apos; | 09:00 - 18:00</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 p-12 flex flex-col justify-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold mb-4">כתבו לנו הודעה</h3>
                  <p className="text-slate-500 mb-8 italic">
                    ניתן ליצור איתנו קשר ישיר דרך המייל או הוואטסאפ לכל עניין טכני או הצעה חדשה.
                  </p>
                  <Button
                    size="xl"
                    variant="outline"
                    className="w-full gap-2 py-8 rounded-2xl"
                    onClick={() => (window.location.href = 'mailto:familynotifys@gmail.com')}
                  >
                    <Mail className="h-5 w-5" /> שלחו מייל עכשיו
                  </Button>
                  <Button
                    size="xl"
                    className="w-full gap-2 py-8 rounded-2xl bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-600/20"
                    onClick={() => (window.location.href = 'https://wa.me/972586412420')}
                  >
                    <MessageSquare className="h-5 w-5" /> הודעה בוואטסאפ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
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
              <Link href="#about" className="hover:text-blue-600 transition-colors">
                אודות
              </Link>
              <Link href="#features" className="hover:text-blue-600 transition-colors">
                תכונות
              </Link>
              <Link href="#contact" className="hover:text-blue-600 transition-colors">
                צור קשר
              </Link>
              <Link href="/legal/privacy" className="hover:text-blue-600 transition-colors">
                פרטיות
              </Link>
              <Link href="/legal/terms" className="hover:text-blue-600 transition-colors">
                תנאים
              </Link>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
            <p>© {new Date().getFullYear()} FamilyNotify. כל הזכויות שמורות.</p>
            <div className="flex gap-4">
              <p>Made with ❤️ for families everywhere</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
