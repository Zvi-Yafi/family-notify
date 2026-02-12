import Link from 'next/link'
import Head from 'next/head'
import { motion } from 'framer-motion'
import {
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Shield,
  CheckCircle2,
  Phone,
  Info,
  Heart,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import { Logo } from '@/components/logo'
import { Header } from '@/components/header'
import { useAuth } from '@/lib/hooks/use-auth'
import { useFamilyContext } from '@/lib/context/family-context'

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

function AuthenticatedHome() {
  const { user } = useAuth()
  const { groups, selectedGroup } = useFamilyContext()

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]

  const quickLinks = [
    {
      title: 'הודעות',
      description: 'צפה בכל ההודעות האחרונות',
      href: '/feed',
      icon: MessageSquare,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    },
    {
      title: 'אירועים',
      description: 'לוח אירועים משפחתי',
      href: '/events',
      icon: Calendar,
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    },
    {
      title: 'ניהול',
      description: 'שלח הודעות וצור אירועים',
      href: '/admin',
      icon: Mail,
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    },
    {
      title: 'הקבוצות שלי',
      description: 'נהל את הקבוצות שלך',
      href: '/groups',
      icon: Users,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              שלום, {displayName} 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {groups.length > 0
                ? `אתה חבר ב-${groups.length} קבוצות`
                : 'ברוך הבא ל-FamilyNotify'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {quickLinks.map((link, idx) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={link.href}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer border-none shadow-md h-full">
                    <CardHeader className="flex flex-row items-center gap-4 p-5">
                      <div className={`p-3 rounded-xl ${link.color}`}>
                        <link.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {link.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {selectedGroup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-none shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">קבוצה פעילה</CardTitle>
                      <CardDescription>{selectedGroup.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              איך זה עובד?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-none shadow-md">
                <CardHeader className="text-center p-5">
                  <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-lg">
                    1
                  </div>
                  <CardTitle className="text-base">צור או הצטרף לקבוצה</CardTitle>
                  <CardDescription className="text-sm">
                    צור קבוצה משפחתית חדשה או הצטרף לקבוצה קיימת באמצעות קוד
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-md">
                <CardHeader className="text-center p-5">
                  <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold text-lg">
                    2
                  </div>
                  <CardTitle className="text-base">שלח הודעות ואירועים</CardTitle>
                  <CardDescription className="text-sm">
                    פרסם הודעות, צור אירועים ותזמן תזכורות לכל חברי הקבוצה
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-md">
                <CardHeader className="text-center p-5">
                  <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-lg">
                    3
                  </div>
                  <CardTitle className="text-base">כולם מקבלים</CardTitle>
                  <CardDescription className="text-sm">
                    ההודעות נשלחות ב-WhatsApp, SMS, אימייל או התראה קולית לפי העדפות כל חבר
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              צריך עזרה?
            </h2>
            <Card className="border-none shadow-md">
              <CardHeader className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base mb-1">שלח לנו מייל</CardTitle>
                      <CardDescription>
                        <a href="mailto:familynotifys@gmail.com" className="text-blue-600 hover:underline">
                          familynotifys@gmail.com
                        </a>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base mb-1">WhatsApp</CardTitle>
                      <CardDescription>
                        <a href="https://wa.me/972533113784" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                          שלח הודעה בוואטסאפ
                        </a>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (user) {
    return <AuthenticatedHome />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      <Head>
        <title>FamNotify – הודעות ועדכונים למשפחה בוואצאפ, SMS ואימייל</title>
        <meta
          name="description"
          content="רשימת תפוצה משפחתית לשליחת הודעות מזל טוב, עדכוני אירועים ותזכורות בוואצאפ, SMS ואימייל. תקשורת רב-ערוצית למשפחות – חינם ומאובטח."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://famnotify.com" />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="he_IL" />
        <meta property="og:site_name" content="FamNotify" />
        <meta property="og:title" content="FamNotify – הודעות ועדכונים למשפחה בוואצאפ, SMS ואימייל" />
        <meta
          property="og:description"
          content="רשימת תפוצה משפחתית לשליחת הודעות מזל טוב, עדכוני אירועים ותזכורות. תקשורת רב-ערוצית למשפחות – חינם ומאובטח."
        />
        <meta property="og:url" content="https://famnotify.com" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FamNotify – הודעות ועדכונים למשפחה בוואצאפ, SMS ואימייל" />
        <meta
          name="twitter:description"
          content="רשימת תפוצה משפחתית לשליחת הודעות מזל טוב, עדכוני אירועים ותזכורות. תקשורת רב-ערוצית למשפחות."
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'FamNotify',
              alternateName: 'FamilyNotify',
              url: 'https://famnotify.com',
              applicationCategory: 'CommunicationApplication',
              operatingSystem: 'Web',
              inLanguage: 'he',
              description:
                'פלטפורמה לניהול הודעות ועדכונים למשפחה בוואצאפ, SMS ואימייל. רשימת תפוצה משפחתית עם תקשורת רב-ערוצית.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'ILS',
              },
              featureList: [
                'שליחת הודעות בוואצאפ',
                'שליחת SMS',
                'שליחת אימייל',
                'שליחת התראות קוליות',
                'ניהול אירועים משפחתיים',
                'תזכורות אוטומטיות',
                'ניהול קבוצות משפחתיות',
                'רשימת תפוצה משפחתית',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'FamNotify',
              url: 'https://famnotify.com',
              logo: 'https://famnotify.com/favicon.svg',
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'familynotifys@gmail.com',
                contactType: 'customer service',
                availableLanguage: 'Hebrew',
              },
            }),
          }}
        />
      </Head>

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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50: dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-8 border border-blue-100 dark:border-blue-800"
            >
              <Globe className="h-4 w-4" />
              <span>פלטפורמת תקשורת רב-ערוצית למשפחות</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]"
            >
              ניהול הודעות ועדכונים <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
                למשפחה בכל ערוצי התקשורת
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mb-12 leading-relaxed"
            >
              רשימת תפוצה משפחתית לשליחת הודעות מזל טוב, עדכוני אירועים ותזכורות – ישירות
              ל-WhatsApp, SMS, אימייל או התראה קולית. תקשורת רב-ערוצית למשפחות, במקום אחד נוח ומאובטח.
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
                    אנחנו מאמינים ששליחת הודעות מזל טוב, עדכוני אירועים ותזכורות משפחתיות
                    צריכים להגיע בצורה מכובדת, ברורה ובזמן הנכון – בדיוק בערוץ שכל בן משפחה מעדיף.
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
              <h2 className="text-4xl font-bold">כל הכלים לניהול רשימת תפוצה משפחתית רב-ערוצית</h2>
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
                  desc: 'שליחה אוטומטית למייל, SMS, WhatsApp והתראות קוליות בהתאמה אישית לכל משתמש.',
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
            <p className="text-blue-100 text-xl">3 צעדים פשוטים ורשימת התפוצה המשפחתית שלכם מוכנה</p>
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
                  desc: 'מגדירים את המיילים והטלפונים של בני המשפחה או החברים ומתחילים לחבר או שולחים להם זימון לקבוצה.',
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

        {/* SEO CONTENT SECTION */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-12 text-right">
              <header className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  FamNotify - מערכת הודעות למשפחה וניהול אירועים משפחתיים
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  ניהול רשימת תפוצה משפחתית בעידן הדיגיטלי לא חייב להיות משימה מורכבת. FamNotify היא
                  פלטפורמה ייעודית לתקשורת רב-ערוצית למשפחות, שנוצרה כדי להעניק מרחב פרטי, מאורגן ושקט
                  לניהול כל מה שקורה בתוך המשפחה. בין אם מדובר בשליחת הודעות מזל טוב, עדכוני אירועים
                  או תיאום שמחה חשובה – המערכת מבטיחה שכל בן משפחה יקבל את המידע בזמן ובדרך הנוחה לו.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                    אתר תזכורות למשפחה: איך זה עובד?
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    שלא כמו קבוצות צ׳אט עמוסות, רשימת התפוצה המשפחתית ב-FamNotify מרכזת את כל
                    המידע בלוח אחד מסודר. בני המשפחה יכולים לצפות בהודעות קודמות, לראות עדכוני
                    אירועים עתידיים בלוח השנה ולוודא שהם לא פספסו שום דבר. המערכת מאפשרת לכם
                    לשלוח הודעות ותזכורות אוטומטיות, כך שלא תצטרכו לרדוף אחרי אף אחד.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                    שליחת הודעות למשפחה בוואצאפ, SMS, אימייל והתראות קוליות
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    אנחנו מבינים שלכל בן משפחה יש את העדפות שלו. סבתא אולי מעדיפה SMS או התראה קולית,
                    ההורים משתמשים באימייל, והצעירים מחוברים לוואטסאפ. FamNotify מאפשרת לכל משתמש לבחור את
                    ערוץ התקשורת המועדף עליו, כך שהודעה אחת שאתם מפרסמים מופצת באופן אוטומטי לכל
                    הערוצים שנבחרו בו-זמנית.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-200">
                  פתרון מושלם לניהול אירועים משפחתיים ושליחת הודעות מזל טוב
                </h3>
                <p className="mb-6 text-slate-600 dark:text-slate-400">
                  מארגנים ברית, שבת חתן או סתם טיול משפחתי? שליחת הודעות מזל טוב ועדכוני אירועים
                  לכל המשפחה לא הייתה פשוטה יותר. עם מערכת תזכורות לוואצאפ למשפחה, תוכלו לוודא
                  שכולם זוכרים את התאריך והמיקום, מבלי להרגיש שאתם מציפים את כולם בהודעות מיותרות.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'מערכת משפחתית פרטית ומאובטחת לחלוטין',
                    'תזכורות לוואטסאפ למשפחה באופן אוטומטי',
                    'סנכרון מלא של כל האירועים בין כל המכשירים',
                    'ממשק פשוט בעברית שמתאים גם למבוגרים',
                    'שליטה מלאה על רמת הפרטיות והגישה לקבוצה',
                    'ארכיון הודעות היסטורי לשימור רגעים משפחתיים',
                  ].map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                    >
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

