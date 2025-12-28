import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bell,
  Calendar,
  MessageSquare,
  Users,
  Loader2,
  X,
  Crown,
  Edit,
  User as UserIcon,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient, UnauthorizedError } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'
import { Header } from '@/components/header'
import { GroupSelector } from '@/components/group-selector'

interface Stats {
  memberCount: number
  announcementsThisMonth: number
  upcomingEvents: number
  messagesSentToday: number
  deliveryStats: {
    sent: number
    queued: number
    failed: number
  }
}

interface Member {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: string
  joinedAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'announcements' | 'events' | 'stats'>('announcements')
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    memberCount: 0,
    announcementsThisMonth: 0,
    upcomingEvents: 0,
    messagesSentToday: 0,
    deliveryStats: {
      sent: 0,
      queued: 0,
      failed: 0,
    },
  })
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const { toast } = useToast()
  const { familyGroupId, groups, loadingGroups, selectedGroup } = useFamilyContext()

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    type: 'GENERAL' as 'GENERAL' | 'SIMCHA',
    scheduledAt: '',
  })

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
    reminderOffsets: [1440, 60], // 24h and 1h before
  })

  // Load stats function
  const loadStats = useCallback(async () => {
    if (!familyGroupId) {
      setStatsLoading(false)
      return
    }

    try {
      setStatsLoading(true)
      const data = await apiClient.getStats(familyGroupId)
      setStats(data)
    } catch (error) {
      // Don't show error for unauthorized - redirect is handled by apiClient
      if (error instanceof UnauthorizedError) {
        return
      }
      console.error('Failed to load stats:', error)
      // Don't show error toast, just use defaults
    } finally {
      setStatsLoading(false)
    }
  }, [familyGroupId])

  // Load stats when familyGroupId changes
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Load members when dialog opens
  const loadMembers = useCallback(async () => {
    if (!familyGroupId) return

    try {
      setLoadingMembers(true)
      const data = await apiClient.getMembers(familyGroupId)
      setMembers(data.members)
    } catch (error) {
      // Don't show error for unauthorized - redirect is handled by apiClient
      if (error instanceof UnauthorizedError) {
        return
      }
      console.error('Failed to load members:', error)
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את רשימת החברים',
        variant: 'destructive',
      })
    } finally {
      setLoadingMembers(false)
    }
  }, [familyGroupId, toast])

  useEffect(() => {
    if (showMembersDialog) {
      loadMembers()
    }
  }, [showMembersDialog, loadMembers])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'EDITOR':
        return <Edit className="h-4 w-4 text-blue-500" />
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'מנהל'
      case 'EDITOR':
        return 'עורך'
      default:
        return 'חבר'
    }
  }

  const roundToTenMinutes = (dateTimeString: string): string => {
    if (!dateTimeString) return ''

    const date = new Date(dateTimeString)
    const minutes = date.getMinutes()

    // עיגול למטה למספר הקרוב ביותר שמתחלק ב-10 (00, 10, 20, 30, 40, 50)
    const roundedMinutes = Math.floor(minutes / 10) * 10

    date.setMinutes(roundedMinutes)
    date.setSeconds(0)
    date.setMilliseconds(0)

    // פורמט YYYY-MM-DDTHH:mm שמתאים ל-datetime-local
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const mins = String(date.getMinutes()).padStart(2, '0')

    // טיפול במקרה שהעיגול הקפיץ את השעה (למשל 16:55 הפך ל-17:00)
    // הפורמט הזה דואג שזה יוצג נכון ב-Input
    return `${year}-${month}-${day}T${hours}:${mins}`
  }

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!familyGroupId) {
      toast({
        title: 'נדרשת הצטרפות לקבוצה',
        description: 'אנא היכנס כאורח דרך דף ההתחלה כדי לפרסם הודעות',
        variant: 'destructive',
      })
      // Redirect to onboarding after a delay
      setTimeout(() => {
        window.location.href = '/onboarding'
      }, 2000)
      return
    }

    setLoading(true)

    try {
      await apiClient.createAnnouncement({
        title: announcementForm.title,
        bodyText: announcementForm.body,
        type: announcementForm.type,
        familyGroupId,
        scheduledAt: announcementForm.scheduledAt || undefined,
      })

      toast({
        title: 'הודעה נוצרה בהצלחה!',
        description: 'ההודעה נשלחה לכל חברי המשפחה',
      })

      // Reload stats to update the count
      await loadStats()

      // Reset form
      setAnnouncementForm({
        title: '',
        body: '',
        type: 'GENERAL',
        scheduledAt: '',
      })
    } catch (error: any) {
      // Don't show error for unauthorized - redirect is handled by apiClient
      if (error instanceof UnauthorizedError) {
        return
      }
      toast({
        title: 'שגיאה',
        description: error.message || 'נכשל ליצור הודעה',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!familyGroupId) {
      toast({
        title: 'נדרשת הצטרפות לקבוצה',
        description: 'אנא היכנס כאורח דרך דף ההתחלה כדי ליצור אירועים',
        variant: 'destructive',
      })
      // Redirect to onboarding after a delay
      setTimeout(() => {
        window.location.href = '/onboarding'
      }, 2000)
      return
    }

    setLoading(true)

    try {
      await apiClient.createEvent({
        title: eventForm.title,
        description: eventForm.description || undefined,
        startsAt: eventForm.startsAt,
        endsAt: eventForm.endsAt || undefined,
        location: eventForm.location || undefined,
        familyGroupId,
        reminderOffsets: eventForm.reminderOffsets,
      })

      toast({
        title: 'אירוע נוצר בהצלחה!',
        description: 'תזכורות יישלחו אוטומטית לפני האירוע',
      })

      // Reload stats to update the count
      await loadStats()

      // Reset form
      setEventForm({
        title: '',
        description: '',
        startsAt: '',
        endsAt: '',
        location: '',
        reminderOffsets: [1440, 60],
      })
    } catch (error: any) {
      // Don't show error for unauthorized - redirect is handled by apiClient
      if (error instanceof UnauthorizedError) {
        return
      }
      toast({
        title: 'שגיאה',
        description: error.message || 'נכשל ליצור אירוע',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading while fetching groups
  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">טוען...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show group selector if no groups or multiple groups without selection
  const needsGroupSelection = groups.length === 0 || (groups.length > 1 && !familyGroupId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Group Selection - Always show for multiple groups or when needed */}
          {(needsGroupSelection || (groups.length > 1 && familyGroupId)) && (
            <div className="mb-8">
              <GroupSelector
                title={familyGroupId ? 'החלף קבוצה' : 'בחר קבוצה'}
                description={
                  familyGroupId
                    ? 'בחר את הקבוצה שאליה תרצה לשלוח הודעות ואירועים'
                    : 'בחר את הקבוצה שאליה תרצה לשלוח הודעות ואירועים'
                }
              />
            </div>
          )}

          {/* Only show content if group is selected */}
          {!needsGroupSelection && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setShowMembersDialog(true)}
                >
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs sm:text-sm">חברי קבוצה</CardDescription>
                    <CardTitle className="text-2xl sm:text-3xl">
                      {statsLoading ? (
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
                      ) : (
                        stats.memberCount
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Users className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push('/feed')}
                >
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs sm:text-sm">הודעות חודש זה</CardDescription>
                    <CardTitle className="text-2xl sm:text-3xl">
                      {statsLoading ? (
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
                      ) : (
                        stats.announcementsThisMonth
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push('/events')}
                >
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs sm:text-sm">אירועים קרובים</CardDescription>
                    <CardTitle className="text-2xl sm:text-3xl">
                      {statsLoading ? (
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
                      ) : (
                        stats.upcomingEvents
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs sm:text-sm">
                      הודעות נשלחו היום
                    </CardDescription>
                    <CardTitle className="text-2xl sm:text-3xl">
                      {statsLoading ? (
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
                      ) : (
                        stats.messagesSentToday
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Bell className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </div>

              {/* Members Dialog */}
              {showMembersDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
                  <Card className="w-full max-w-2xl max-h-[100vh] sm:max-h-[80vh] overflow-hidden flex flex-col rounded-none sm:rounded-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 p-4 sm:p-6">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl truncate">חברי הקבוצה</CardTitle>
                        <CardDescription className="text-xs sm:text-sm truncate">
                          {selectedGroup?.name} - {stats.memberCount} חברים
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMembersDialog(false)}
                        className="flex-shrink-0 touch-target"
                        aria-label="סגור"
                      >
                        <X className="h-5 w-5 sm:h-4 sm:w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
                      {loadingMembers ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                      ) : members.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600">אין חברים בקבוצה</p>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {members.map((member) => {
                            // Use name if available, otherwise extract from email
                            const displayName = member.name || member.email.split('@')[0]

                            return (
                              <div
                                key={member.id}
                                className="flex flex-col sm:flex-row items-start justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors gap-3"
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center flex-shrink-0">
                                    <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-300" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {/* שורה 1: שם */}
                                    <p className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 truncate">
                                      {displayName}
                                    </p>

                                    {/* שורה 2: מייל */}
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                      📧 {member.email}
                                    </p>

                                    {/* שורה 3: תאריך הצטרפות */}
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1 flex-wrap">
                                      <Calendar className="h-3 w-3 inline" />
                                      <span className="truncate">
                                        הצטרף ב-{' '}
                                        {new Date(member.joinedAt).toLocaleDateString('he-IL', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    </p>

                                    {/* טלפון (אם קיים) */}
                                    {member.phone && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                                        📱 {member.phone}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 sm:mr-3">
                                  {getRoleIcon(member.role)}
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {getRoleLabel(member.role)}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabs */}
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <Button
                  variant={activeTab === 'announcements' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('announcements')}
                  className="w-full sm:w-auto touch-target justify-center"
                >
                  <MessageSquare className="h-4 w-4 ml-2" />
                  הודעה חדשה
                </Button>
                <Button
                  variant={activeTab === 'events' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('events')}
                  className="w-full sm:w-auto touch-target justify-center"
                >
                  <Calendar className="h-4 w-4 ml-2" />
                  אירוע חדש
                </Button>
                <Button
                  variant={activeTab === 'stats' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('stats')}
                  className="w-full sm:w-auto touch-target justify-center"
                >
                  <Bell className="h-4 w-4 ml-2" />
                  סטטוסים
                </Button>
              </div>

              {/* Announcement Form */}
              {activeTab === 'announcements' && (
                <Card>
                  <CardHeader>
                    <CardTitle>פרסם הודעה חדשה</CardTitle>
                    <CardDescription>
                      ההודעה תישלח לכל חברי הקבוצה בהתאם להעדפות שלהם
                    </CardDescription>
                    {/* Show selected group indicator */}
                    {selectedGroup && groups.length > 1 && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800 dark:text-blue-200">
                            שולח לקבוצה: <strong>{selectedGroup.name}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="title" className="text-sm sm:text-base">
                          כותרת
                        </Label>
                        <Input
                          id="title"
                          placeholder="למשל: ברית למזל טוב"
                          value={announcementForm.title}
                          onChange={(e) =>
                            setAnnouncementForm({ ...announcementForm, title: e.target.value })
                          }
                          required
                          className="text-base touch-target"
                        />
                      </div>

                      <div>
                        <Label htmlFor="body" className="text-sm sm:text-base">
                          תוכן ההודעה
                        </Label>
                        <textarea
                          id="body"
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="פרטי ההודעה..."
                          value={announcementForm.body}
                          onChange={(e) =>
                            setAnnouncementForm({ ...announcementForm, body: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-sm sm:text-base">סוג הודעה</Label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                          <Button
                            type="button"
                            variant={announcementForm.type === 'GENERAL' ? 'default' : 'outline'}
                            onClick={() =>
                              setAnnouncementForm({ ...announcementForm, type: 'GENERAL' })
                            }
                            className="w-full sm:w-auto touch-target"
                          >
                            כללי
                          </Button>
                          <Button
                            type="button"
                            variant={announcementForm.type === 'SIMCHA' ? 'default' : 'outline'}
                            onClick={() =>
                              setAnnouncementForm({ ...announcementForm, type: 'SIMCHA' })
                            }
                            className="w-full sm:w-auto touch-target"
                          >
                            שמחה 🎉
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="scheduledAt" className="text-sm sm:text-base">
                          תזמון שליחה (אופציונלי)
                        </Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          step="600" // זהו המפתח - 600 שניות הן 10 דקות
                          value={announcementForm.scheduledAt}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val) {
                              setAnnouncementForm({
                                ...announcementForm,
                                scheduledAt: roundToTenMinutes(val),
                              })
                            } else {
                              setAnnouncementForm({ ...announcementForm, scheduledAt: '' })
                            }
                          }}
                          className="text-base touch-target"
                        />
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          הזמן יוגבל לקפיצות של 10 דקות (למשל: 10, 20, 30...)
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button type="submit" className="flex-1 touch-target" disabled={loading}>
                          {loading
                            ? 'שולח...'
                            : announcementForm.scheduledAt
                              ? 'תזמן לשליחה'
                              : 'שלח עכשיו'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setAnnouncementForm({
                              title: '',
                              body: '',
                              type: 'GENERAL',
                              scheduledAt: '',
                            })
                          }
                          className="w-full sm:w-auto touch-target"
                        >
                          נקה
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Event Form */}
              {activeTab === 'events' && (
                <Card>
                  <CardHeader>
                    <CardTitle>צור אירוע חדש</CardTitle>
                    <CardDescription>תזכורות יישלחו אוטומטית לפני האירוע</CardDescription>
                    {/* Show selected group indicator */}
                    {selectedGroup && groups.length > 1 && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800 dark:text-blue-200">
                            שולח לקבוצה: <strong>{selectedGroup.name}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEventSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="eventTitle" className="text-sm sm:text-base">
                          כותרת האירוע
                        </Label>
                        <Input
                          id="eventTitle"
                          placeholder="למשל: יום הולדת לסבתא"
                          value={eventForm.title}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          required
                          className="text-base touch-target"
                        />
                      </div>

                      <div>
                        <Label htmlFor="eventDescription" className="text-sm sm:text-base">
                          תיאור (אופציונלי)
                        </Label>
                        <textarea
                          id="eventDescription"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="פרטים נוספים על האירוע..."
                          value={eventForm.description}
                          onChange={(e) =>
                            setEventForm({ ...eventForm, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startsAt" className="text-sm sm:text-base">
                            תחילת האירוע
                          </Label>
                          <Input
                            id="startsAt"
                            type="datetime-local"
                            step="600"
                            value={eventForm.startsAt}
                            onChange={(e) => {
                              const roundedTime = roundToTenMinutes(e.target.value)
                              setEventForm({ ...eventForm, startsAt: roundedTime })
                            }}
                            onBlur={(e) => {
                              if (e.target.value) {
                                const roundedTime = roundToTenMinutes(e.target.value)
                                setEventForm({ ...eventForm, startsAt: roundedTime })
                              }
                            }}
                            required
                            className="text-base touch-target"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            הזמן יעוגל אוטומטית לקפיצות של 10 דקות
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="endsAt" className="text-sm sm:text-base">
                            סיום האירוע (אופציונלי)
                          </Label>
                          <Input
                            id="endsAt"
                            type="datetime-local"
                            step="600"
                            value={eventForm.endsAt}
                            onChange={(e) => {
                              const roundedTime = roundToTenMinutes(e.target.value)
                              setEventForm({ ...eventForm, endsAt: roundedTime })
                            }}
                            onBlur={(e) => {
                              if (e.target.value) {
                                const roundedTime = roundToTenMinutes(e.target.value)
                                setEventForm({ ...eventForm, endsAt: roundedTime })
                              }
                            }}
                            className="text-base touch-target"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            הזמן יעוגל אוטומטית לקפיצות של 10 דקות
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="location" className="text-sm sm:text-base">
                          מיקום
                        </Label>
                        <Input
                          id="location"
                          placeholder="כתובת או שם המקום"
                          value={eventForm.location}
                          onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                          className="text-base touch-target"
                        />
                      </div>

                      <div>
                        <Label className="text-sm sm:text-base">תזכורות אוטומטיות</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs sm:text-sm bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded">
                            24 שעות לפני
                          </span>
                          <span className="text-xs sm:text-sm bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded">
                            שעה לפני
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button type="submit" className="flex-1 touch-target" disabled={loading}>
                          {loading ? 'יוצר...' : 'צור אירוע'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setEventForm({
                              title: '',
                              description: '',
                              startsAt: '',
                              endsAt: '',
                              location: '',
                              reminderOffsets: [1440, 60],
                            })
                          }
                          className="w-full sm:w-auto touch-target"
                        >
                          נקה
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              {activeTab === 'stats' && (
                <Card>
                  <CardHeader>
                    <CardTitle>סטטוסי שליחה</CardTitle>
                    <CardDescription>מעקב אחרי הודעות שנשלחו</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div>
                            <p className="font-medium">נשלחו בהצלחה</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">כל הזמנים</p>
                          </div>
                          <span className="text-2xl font-bold text-green-600">
                            {stats.deliveryStats.sent}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div>
                            <p className="font-medium">בתור</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ממתינים לשליחה
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-yellow-600">
                            {stats.deliveryStats.queued}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div>
                            <p className="font-medium">נכשלו</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">דורשים טיפול</p>
                          </div>
                          <span className="text-2xl font-bold text-red-600">
                            {stats.deliveryStats.failed}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
