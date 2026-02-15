import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import {
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Search,
  ArrowUpDown,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Bell,
  PhoneCall,
  Send,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import type {
  DashboardResult,
  ChannelStats,
  PeriodDeliveryStats,
  GroupDashboardStats,
} from '@/lib/services/super-admin-dashboard.service'

const SUPER_ADMIN_EMAIL = 'z0533113784@gmail.com'

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: '#3B82F6',
  WHATSAPP: '#22C55E',
  SMS: '#F97316',
  PUSH: '#8B5CF6',
  VOICE_CALL: '#EC4899',
}

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: 'אימייל',
  WHATSAPP: 'וואצאפ',
  SMS: 'SMS',
  PUSH: 'התראות',
  VOICE_CALL: 'שיחה קולית',
}

const STATUS_COLORS: Record<string, string> = {
  sent: '#10B981',
  failed: '#EF4444',
  queued: '#F59E0B',
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  SMS: Phone,
  PUSH: Bell,
  VOICE_CALL: PhoneCall,
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString('he-IL')
}

function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  subtitle?: string
  trend?: string
  accentColor: string
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow">
        <div className="h-1.5" style={{ backgroundColor: accentColor }} />
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-right">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </CardTitle>
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="text-right">
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {trend && (
                <span className="text-emerald-500 font-semibold ml-1.5">{trend}</span>
              )}
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ChannelBadge({ channel, count }: { channel: string; count: number }) {
  const Icon = CHANNEL_ICONS[channel] || Send
  const color = CHANNEL_COLORS[channel] || '#6B7280'
  const label = CHANNEL_LABELS[channel] || channel

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span
        className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-bold"
        style={{ backgroundColor: color }}
      >
        {count}
      </span>
    </div>
  )
}

function PeriodStatsPanel({ stats }: { stats: PeriodDeliveryStats }) {
  const channels = Object.entries(stats.byChannel).filter(([, v]) => v > 0)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-right">
        <div className="flex items-center justify-between mb-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            נשלחו בהצלחה
          </span>
        </div>
        <div className="text-2xl font-bold text-emerald-600">{formatNumber(stats.sent)}</div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-right">
        <div className="flex items-center justify-between mb-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">נכשלו</span>
        </div>
        <div className="text-2xl font-bold text-red-600">{formatNumber(stats.failed)}</div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-right">
        <div className="flex items-center justify-between mb-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">בהמתנה</span>
        </div>
        <div className="text-2xl font-bold text-amber-600">{formatNumber(stats.queued)}</div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-right">
        <div className="flex items-center justify-between mb-2">
          <Send className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">סה״כ</span>
        </div>
        <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.total)}</div>
      </div>

      {channels.length > 0 && (
        <div className="col-span-full">
          <div className="text-sm font-medium text-gray-500 mb-3">פירוט לפי ערוץ (נשלחו)</div>
          <div className="flex flex-wrap gap-2">
            {channels.map(([ch, count]) => (
              <ChannelBadge key={ch} channel={ch} count={count} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 border border-gray-100 dark:border-gray-700"
      dir="rtl"
    >
      <p className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-200">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs py-0.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 dark:text-gray-400">
            {entry.name}: <strong className="text-gray-900 dark:text-gray-100">{entry.value}</strong>
          </span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0]
  return (
    <div
      className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-3 border border-gray-100 dark:border-gray-700"
      dir="rtl"
    >
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.fill }} />
        <span className="font-medium">{data.name}</span>
        <span className="font-bold">{data.value}</span>
      </div>
    </div>
  )
}

export default function SuperAdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const res = await fetch('/api/super-admin/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      const data = await res.json()
      setDashboard(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!authLoading && (!user || user.email !== SUPER_ADMIN_EMAIL)) {
      router.push('/')
      return
    }

    if (user && user.email === SUPER_ADMIN_EMAIL) {
      fetchDashboard()
    }
  }, [user, authLoading, router])

  const filteredGroups = useMemo(() => {
    if (!dashboard) return []
    return dashboard.groups.filter(
      (g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.admins.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [dashboard, searchTerm])

  const sortedGroups = useMemo(() => {
    if (!sortConfig) return filteredGroups
    return [...filteredGroups].sort((a, b) => {
      const { key, direction } = sortConfig
      let aVal: any
      let bVal: any

      if (key === 'deliveries.total') {
        aVal = a.deliveries.total
        bVal = b.deliveries.total
      } else if (key === 'deliveries.todaySent') {
        aVal = a.deliveries.todaySent
        bVal = b.deliveries.todaySent
      } else {
        aVal = (a as any)[key]
        bVal = (b as any)[key]
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredGroups, sortConfig])

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const channelPieData = useMemo(() => {
    if (!dashboard) return []
    return dashboard.channelBreakdown.map((item) => ({
      name: CHANNEL_LABELS[item.channel] || item.channel,
      value: item.sent,
      fill: CHANNEL_COLORS[item.channel] || '#6B7280',
    }))
  }, [dashboard])

  const statusPieData = useMemo(() => {
    if (!dashboard) return []
    return [
      { name: 'נשלחו', value: dashboard.overview.totalSent, fill: STATUS_COLORS.sent },
      { name: 'נכשלו', value: dashboard.overview.totalFailed, fill: STATUS_COLORS.failed },
      { name: 'בהמתנה', value: dashboard.overview.totalQueued, fill: STATUS_COLORS.queued },
    ].filter((item) => item.value > 0)
  }, [dashboard])

  const trendData = useMemo(() => {
    if (!dashboard) return []
    return dashboard.dailyTrend.map((item) => ({
      ...item,
      date: item.date.slice(5),
    }))
  }, [dashboard])

  const groupBarData = useMemo(() => {
    if (!dashboard) return []
    return dashboard.groups
      .filter((g) => g.deliveries.total > 0)
      .sort((a, b) => b.deliveries.total - a.deliveries.total)
      .slice(0, 10)
      .map((g) => ({
        name: g.name.length > 12 ? g.name.slice(0, 12) + '...' : g.name,
        EMAIL: g.deliveries.byChannel.EMAIL,
        WHATSAPP: g.deliveries.byChannel.WHATSAPP,
        SMS: g.deliveries.byChannel.SMS,
        PUSH: g.deliveries.byChannel.PUSH,
        VOICE_CALL: g.deliveries.byChannel.VOICE_CALL,
      }))
  }, [dashboard])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">טוען את לוח הבקרה...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  const { overview, periodStats } = dashboard

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" dir="rtl">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                לוח בקרה ראשי
              </h1>
              <p className="text-gray-500 mt-1">סקירה מקיפה של כל הפעילות במערכת FamilyNotify</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                רענון
              </Button>
              <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full text-blue-700 font-medium border border-blue-100 dark:border-blue-800">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                מנהל מערכת
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
              title="משתמשים"
              value={formatNumber(overview.totalUsers)}
              icon={Users}
              subtitle="בכל המערכת"
              trend={`+${overview.newUsers30d}`}
              accentColor="#3B82F6"
            />
            <KPICard
              title="קבוצות"
              value={formatNumber(overview.totalGroups)}
              icon={BarChart3}
              subtitle="פעילות"
              trend={`+${overview.newGroups30d}`}
              accentColor="#8B5CF6"
            />
            <KPICard
              title="הודעות"
              value={formatNumber(overview.totalAnnouncements)}
              icon={MessageSquare}
              subtitle="פורסמו"
              accentColor="#F97316"
            />
            <KPICard
              title="אירועים"
              value={formatNumber(overview.totalEvents)}
              icon={Calendar}
              subtitle="נוצרו"
              accentColor="#EC4899"
            />
            <KPICard
              title="שליחות"
              value={formatNumber(overview.totalDeliveries)}
              icon={Send}
              subtitle={`${formatNumber(overview.totalSent)} נשלחו`}
              accentColor="#10B981"
            />
            <KPICard
              title="אחוז הצלחה"
              value={`${overview.successRate}%`}
              icon={TrendingUp}
              subtitle="מכלל השליחות"
              accentColor={overview.successRate >= 90 ? '#10B981' : overview.successRate >= 70 ? '#F59E0B' : '#EF4444'}
            />
          </div>

          <Tabs defaultValue="today" dir="rtl">
            <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">סטטיסטיקות לפי תקופה</CardTitle>
                  </div>
                  <TabsList className="bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="today">היום</TabsTrigger>
                    <TabsTrigger value="week">השבוע</TabsTrigger>
                    <TabsTrigger value="month">החודש</TabsTrigger>
                    <TabsTrigger value="year">השנה</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <TabsContent value="today">
                  <PeriodStatsPanel stats={periodStats.today} />
                </TabsContent>
                <TabsContent value="week">
                  <PeriodStatsPanel stats={periodStats.week} />
                </TabsContent>
                <TabsContent value="month">
                  <PeriodStatsPanel stats={periodStats.month} />
                </TabsContent>
                <TabsContent value="year">
                  <PeriodStatsPanel stats={periodStats.year} />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden">
              <div className="h-1 bg-gradient-to-l from-blue-500 via-green-500 to-purple-500" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  התפלגות לפי ערוץ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {channelPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={channelPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {channelPieData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        formatter={(value) => (
                          <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    אין נתוני שליחה עדיין
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden">
              <div className="h-1 bg-gradient-to-l from-emerald-500 via-amber-500 to-red-500" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  סטטוס שליחות
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusPieData.length > 0 ? (
                  <div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                          formatter={(value) => (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <div className="text-lg font-bold text-emerald-600">
                          {formatNumber(overview.totalSent)}
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                          נשלחו
                        </div>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {formatNumber(overview.totalFailed)}
                        </div>
                        <div className="text-[10px] text-red-700 dark:text-red-300">נכשלו</div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div className="text-lg font-bold text-amber-600">
                          {formatNumber(overview.totalQueued)}
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-300">
                          בהמתנה
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    אין נתוני שליחה עדיין
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden">
            <div className="h-1 bg-gradient-to-l from-blue-500 to-emerald-500" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                מגמת שליחות - 30 ימים אחרונים
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.some((d) => d.sent > 0 || d.failed > 0) ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gradEmail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradWhatsapp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradSms" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPush" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradVoice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="EMAIL"
                      name={CHANNEL_LABELS.EMAIL}
                      stackId="1"
                      stroke="#3B82F6"
                      fill="url(#gradEmail)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="WHATSAPP"
                      name={CHANNEL_LABELS.WHATSAPP}
                      stackId="1"
                      stroke="#22C55E"
                      fill="url(#gradWhatsapp)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="SMS"
                      name={CHANNEL_LABELS.SMS}
                      stackId="1"
                      stroke="#F97316"
                      fill="url(#gradSms)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="PUSH"
                      name={CHANNEL_LABELS.PUSH}
                      stackId="1"
                      stroke="#8B5CF6"
                      fill="url(#gradPush)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="VOICE_CALL"
                      name={CHANNEL_LABELS.VOICE_CALL}
                      stackId="1"
                      stroke="#EC4899"
                      fill="url(#gradVoice)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">
                  אין נתוני שליחה ב-30 ימים אחרונים
                </div>
              )}
            </CardContent>
          </Card>

          {groupBarData.length > 0 && (
            <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden">
              <div className="h-1 bg-gradient-to-l from-violet-500 to-pink-500" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-violet-600" />
                  Top 10 קבוצות לפי שליחות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={groupBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="EMAIL"
                      name={CHANNEL_LABELS.EMAIL}
                      stackId="a"
                      fill="#3B82F6"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="WHATSAPP"
                      name={CHANNEL_LABELS.WHATSAPP}
                      stackId="a"
                      fill="#22C55E"
                    />
                    <Bar dataKey="SMS" name={CHANNEL_LABELS.SMS} stackId="a" fill="#F97316" />
                    <Bar dataKey="PUSH" name={CHANNEL_LABELS.PUSH} stackId="a" fill="#8B5CF6" />
                    <Bar
                      dataKey="VOICE_CALL"
                      name={CHANNEL_LABELS.VOICE_CALL}
                      stackId="a"
                      fill="#EC4899"
                      radius={[0, 4, 4, 0]}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
                      )}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
            <div className="h-1 bg-gradient-to-l from-blue-600 to-cyan-500" />
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">פירוט מלא לפי קבוצה</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {dashboard.groups.length} קבוצות במערכת
                  </p>
                </div>
                <div className="relative w-full md:w-80">
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
              <table className="w-full text-right border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs font-medium uppercase tracking-wide">
                    <th
                      className="p-3 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        קבוצה <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3">מנהלים</th>
                    <th
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => requestSort('memberCount')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        חברים <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => requestSort('announcementCount')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        הודעות <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => requestSort('eventCount')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        אירועים <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => requestSort('deliveries.total')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        שליחות כולל <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-center cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => requestSort('deliveries.todaySent')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        היום <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-center">פירוט ערוצים</th>
                    <th className="p-3">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                          {group.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">/{group.slug}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          {group.admins.map((admin, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-gray-500 truncate max-w-[120px]"
                              title={admin}
                            >
                              {admin}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {group.memberCount}
                        </Badge>
                      </td>
                      <td className="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {group.announcementCount}
                      </td>
                      <td className="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {group.eventCount}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-sm">{group.deliveries.total}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-500 font-medium">
                              {group.deliveries.sent} ✓
                            </span>
                            {group.deliveries.failed > 0 && (
                              <span className="text-[10px] text-red-500 font-medium">
                                {group.deliveries.failed} ✗
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {group.deliveries.todaySent > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                            {group.deliveries.todaySent}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {Object.entries(group.deliveries.byChannel)
                            .filter(([, v]) => v > 0)
                            .map(([ch, count]) => {
                              const Icon = CHANNEL_ICONS[ch] || Send
                              const color = CHANNEL_COLORS[ch] || '#6B7280'
                              return (
                                <div
                                  key={ch}
                                  className="flex flex-col items-center"
                                  title={`${CHANNEL_LABELS[ch]}: ${count}`}
                                >
                                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                                  <span
                                    className="text-[9px] font-bold"
                                    style={{ color }}
                                  >
                                    {count}
                                  </span>
                                </div>
                              )
                            })}
                          {Object.values(group.deliveries.byChannel).every((v) => v === 0) && (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" asChild className="gap-1 text-blue-600 text-xs">
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
                      <td colSpan={9} className="p-12 text-center text-gray-500">
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
