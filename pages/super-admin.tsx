import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import {
  Users,
  Settings,
  BarChart3,
  Calendar,
  MessageSquare,
  UserPlus,
  ShieldCheck,
  Search,
  ArrowUpDown,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface GlobalStats {
  totalUsers: number
  totalGroups: number
  totalAnnouncements: number
  totalEvents: number
  totalInvitations: number
  newUsers30d: number
  newGroups30d: number
}

interface GroupInfo {
  id: string
  name: string
  slug: string
  createdAt: string
  memberCount: number
  announcementCount: number
  eventCount: number
  admins: string[]
  preferenceCounts: {
    EMAIL: number
    WHATSAPP: number
    SMS: number
    PUSH: number
  }
}

export default function SuperAdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof GroupInfo
    direction: 'asc' | 'desc'
  } | null>(null)

  const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'

  useEffect(() => {
    if (!authLoading && (!user || user.email !== SUPER_ADMIN_EMAIL)) {
      router.push('/')
      return
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/super-admin/stats')
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats(data.global)
        setGroups(data.groups)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (user && user.email === SUPER_ADMIN_EMAIL) {
      fetchStats()
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.admins.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1
    return 0
  })

  const requestSort = (key: keyof GroupInfo) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const StatCard = ({ title, value, icon: Icon, description, trend }: any) => (
    <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-gray-900">
      <div className="h-1 bg-blue-600" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-right">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="text-right">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
          {trend && <span className="text-green-500 mr-1">{trend}</span>}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" dir="rtl">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                ניהול משתמשים וקבוצות - מערכת כללית
              </h1>
              <p className="text-gray-500 mt-2">ברוך הבא למרכז הבקרה של FamilyNotify.</p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full text-blue-700 font-medium border border-blue-100 dark:border-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              מחובר כאל מנהל מערכת
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="סך כל המשתמשים"
              value={stats?.totalUsers}
              icon={Users}
              description="בכל האתר"
              trend={`+${stats?.newUsers30d} החודש`}
            />
            <StatCard
              title="סך כל הקבוצות"
              value={stats?.totalGroups}
              icon={BarChart3}
              description="פעילות במערכת"
              trend={`+${stats?.newGroups30d} החודש`}
            />
            <StatCard
              title="הודעות שפורסמו"
              value={stats?.totalAnnouncements}
              icon={MessageSquare}
              description="בכל הקבוצות"
            />
            <StatCard
              title="אירועים שנוצרו"
              value={stats?.totalEvents}
              icon={Calendar}
              description="בלוחות השנה"
            />
          </div>

          <Card className="border-none shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>פירוט קבוצות</CardTitle>
                  <CardDescription>ניהול ומעקב אחרי כל הקבוצות במערכת</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="חיפוש קבוצה, מנהל או סלאג..."
                    className="pr-10 h-10 bg-gray-50 dark:bg-gray-800 border-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-sm font-medium">
                    <th
                      className="p-4 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        שם הקבוצה <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-4">מנהלים</th>
                    <th
                      className="p-4 cursor-pointer hover:text-blue-600 transition-colors text-center"
                      onClick={() => requestSort('memberCount')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        חברים <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:text-blue-600 transition-colors text-center"
                      onClick={() => requestSort('announcementCount')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        הודעות <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:text-blue-600 transition-colors text-center"
                      onClick={() => requestSort('eventCount')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        אירועים <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-4 text-center">העדפות התראה</th>
                    <th
                      className="p-4 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => requestSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        נוצרה בתאריך <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-4">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {group.name}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">/{group.slug}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {group.admins.map((admin, idx) => (
                            <span
                              key={idx}
                              className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]"
                              title={admin}
                            >
                              {admin}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {group.memberCount}
                        </div>
                      </td>
                      <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                        {group.announcementCount}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {group.preferenceCounts.EMAIL > 0 && (
                            <div className="flex flex-col items-center" title="אימייל">
                              <Mail className="h-4 w-4 text-blue-500" />
                              <span className="text-[10px] font-bold">
                                {group.preferenceCounts.EMAIL}
                              </span>
                            </div>
                          )}
                          {group.preferenceCounts.WHATSAPP > 0 && (
                            <div className="flex flex-col items-center" title="WhatsApp">
                              <MessageSquare className="h-4 w-4 text-green-500" />
                              <span className="text-[10px] font-bold">
                                {group.preferenceCounts.WHATSAPP}
                              </span>
                            </div>
                          )}
                          {group.preferenceCounts.SMS > 0 && (
                            <div className="flex flex-col items-center" title="SMS">
                              <Phone className="h-4 w-4 text-orange-500" />
                              <span className="text-[10px] font-bold">
                                {group.preferenceCounts.SMS}
                              </span>
                            </div>
                          )}
                          {group.preferenceCounts.PUSH > 0 && (
                            <div className="flex flex-col items-center" title="התראות">
                              <Bell className="h-4 w-4 text-purple-500" />
                              <span className="text-[10px] font-bold">
                                {group.preferenceCounts.PUSH}
                              </span>
                            </div>
                          )}
                          {Object.values(group.preferenceCounts).every((v) => v === 0) && (
                            <span className="text-xs text-gray-400">אין העדפות</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(group.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-blue-600"
                        >
                          <Link href={`/super-admin/group/${group.id}`}>
                            <ExternalLink className="h-3 w-3" />
                            צפייה
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {sortedGroups.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-500">
                        לא נמצאו קבוצות התואמות את החיפוש
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
