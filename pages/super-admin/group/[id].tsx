import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import {
  ArrowRight,
  MessageSquare,
  Calendar,
  Users,
  BarChart3,
  ExternalLink,
  ShieldAlert,
  Clock,
  User,
  Loader2,
  Mail,
  Phone,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'

export default function GroupObserverPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, loading: authLoading } = useAuth()

  const [group, setGroup] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'

  useEffect(() => {
    if (!authLoading && (!user || user.email !== SUPER_ADMIN_EMAIL)) {
      router.push('/')
      return
    }

    if (!id || typeof id !== 'string' || !user || user.email !== SUPER_ADMIN_EMAIL) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [groupRes, statsRes, membersRes, announcementsRes, eventsRes] = await Promise.all([
          fetch(`/api/groups/${id}`),
          fetch(`/api/admin/stats?familyGroupId=${id}`),
          fetch(`/api/admin/members?familyGroupId=${id}`),
          fetch(`/api/admin/announcements?familyGroupId=${id}`),
          fetch(`/api/admin/events?familyGroupId=${id}&includePast=true`),
        ])

        if (groupRes.ok) setGroup((await groupRes.json()).group)
        if (statsRes.ok) setStats(await statsRes.json())
        if (membersRes.ok) setMembers((await membersRes.json()).members)
        if (announcementsRes.ok) setAnnouncements((await announcementsRes.json()).announcements)
        if (eventsRes.ok) setEvents((await eventsRes.json()).events)
      } catch (err) {
        console.error('Observer Fetch Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user, authLoading, router])

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

  if (!group) return <div>Group not found</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" dir="rtl">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="gap-2">
              <Link href="/super-admin">
                <ArrowRight className="h-4 w-4" />
                חזרה לניהול
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full text-amber-700 font-medium border border-amber-100 dark:border-amber-800">
              <ShieldAlert className="h-3 w-3" />
              מצב תצוגה - מנהל מערכת
            </div>
          </div>

          {/* Group Header Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
              <p className="text-gray-500 mt-1 font-mono">/{group.slug}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  נוצרה ב-{new Date(group.createdAt).toLocaleDateString('he-IL')}
                </div>
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Users className="h-4 w-4" />
                  {members.length} חברים
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xl font-bold">{stats?.announcementsThisMonth || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                  הודעות החודש
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xl font-bold">{stats?.upcomingEvents || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                  אירועים קרובים
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xl font-bold">{stats?.messagesSentToday || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">נשלחו היום</div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-1 rounded-xl">
              <TabsTrigger
                value="announcements"
                className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <MessageSquare className="h-4 w-4 ml-2" />
                הודעות ({announcements.length})
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Calendar className="h-4 w-4 ml-2" />
                אירועים ({events.length})
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 ml-2" />
                חברים ({members.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="mt-6 space-y-4">
              {announcements.map((a) => (
                <Card
                  key={a.id}
                  className="border-none shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${a.type === 'SIMCHA' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {a.type === 'SIMCHA' ? 'שמחה' : 'כללי'}
                      </span>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <User className="h-3 w-3" />
                      {a.creator?.email || 'Unknown'} •{' '}
                      {new Date(a.createdAt).toLocaleDateString('he-IL')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {a.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {announcements.length === 0 && (
                <div className="py-20 text-center text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  אין הודעות בקבוצה זו
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-6 space-y-4">
              {events.map((e) => (
                <Card key={e.id} className="border-none shadow-sm dark:bg-gray-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{e.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />{' '}
                        {new Date(e.startsAt).toLocaleString('he-IL')}
                      </span>
                      {e.location && <span className="text-gray-400">|</span>}
                      {e.location && <span>📍 {e.location}</span>}
                    </CardDescription>
                  </CardHeader>
                  {e.description && (
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{e.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
              {events.length === 0 && (
                <div className="py-20 text-center text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  אין אירועים בקבוצה זו
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <Card className="border-none shadow-sm dark:bg-gray-900 overflow-hidden">
                <CardContent className="p-0">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs">
                        <th className="p-4 font-medium">משתמש</th>
                        <th className="p-4 font-medium">תפקיד</th>
                        <th className="p-4 font-medium text-center">העדפות התראה</th>
                        <th className="p-4 font-medium">הצטרף ב-</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-4">
                            <div className="font-semibold">{m.name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-500">{m.email}</div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${m.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}
                            >
                              {m.role === 'ADMIN' ? 'מנהל' : m.role === 'EDITOR' ? 'עורך' : 'חבר'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {m.preferences?.includes('EMAIL') && (
                                <div title="אימייל">
                                  <Mail className="h-4 w-4 text-blue-500" />
                                </div>
                              )}
                              {m.preferences?.includes('WHATSAPP') && (
                                <div title="WhatsApp">
                                  <MessageSquare className="h-4 w-4 text-green-500" />
                                </div>
                              )}
                              {m.preferences?.includes('SMS') && (
                                <div title="SMS">
                                  <Phone className="h-4 w-4 text-orange-500" />
                                </div>
                              )}
                              {m.preferences?.includes('PUSH') && (
                                <div title="התראות">
                                  <Bell className="h-4 w-4 text-purple-500" />
                                </div>
                              )}
                              {(!m.preferences || m.preferences.length === 0) && (
                                <span className="text-[10px] text-gray-400">ללא</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-gray-500">
                            {new Date(m.joinedAt).toLocaleDateString('he-IL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
