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
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setShowMembersDialog(true)}
                >
                  <CardHeader className="pb-3">
                    <CardDescription>חברי קבוצה</CardDescription>
                    <CardTitle className="text-3xl">
                      {statsLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                    <CardDescription>הודעות חודש זה</CardDescription>
                    <CardTitle className="text-3xl">
                      {statsLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                    <CardDescription>אירועים קרובים</CardDescription>
                    <CardTitle className="text-3xl">
                      {statsLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                    <CardDescription>הודעות נשלחו היום</CardDescription>
                    <CardTitle className="text-3xl">
                      {statsLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle>חברי הקבוצה</CardTitle>
                        <CardDescription>
                          {selectedGroup?.name} - {stats.memberCount} חברים
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMembersDialog(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
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
                        <div className="space-y-2">
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{member.email}</p>
                                  {member.phone && (
                                    <p className="text-sm text-gray-500">{member.phone}</p>
                                  )}
                                  <p className="text-xs text-gray-400">
                                    הצטרף ב-{' '}
                                    {new Date(member.joinedAt).toLocaleDateString('he-IL', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getRoleIcon(member.role)}
                                <span className="text-sm text-gray-600">
                                  {getRoleLabel(member.role)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={activeTab === 'announcements' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('announcements')}
                >
                  <MessageSquare className="h-4 w-4 ml-2" />
                  הודעה חדשה
                </Button>
                <Button
                  variant={activeTab === 'events' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('events')}
                >
                  <Calendar className="h-4 w-4 ml-2" />
                  אירוע חדש
                </Button>
                <Button
                  variant={activeTab === 'stats' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('stats')}
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
                        <Label htmlFor="title">כותרת</Label>
                        <Input
                          id="title"
                          placeholder="למשל: ברית למזל טוב"
                          value={announcementForm.title}
                          onChange={(e) =>
                            setAnnouncementForm({ ...announcementForm, title: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="body">תוכן ההודעה</Label>
                        <textarea
                          id="body"
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="פרטי ההודעה..."
                          value={announcementForm.body}
                          onChange={(e) =>
                            setAnnouncementForm({ ...announcementForm, body: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label>סוג הודעה</Label>
                        <div className="flex gap-4 mt-2">
                          <Button
                            type="button"
                            variant={announcementForm.type === 'GENERAL' ? 'default' : 'outline'}
                            onClick={() =>
                              setAnnouncementForm({ ...announcementForm, type: 'GENERAL' })
                            }
                          >
                            כללי
                          </Button>
                          <Button
                            type="button"
                            variant={announcementForm.type === 'SIMCHA' ? 'default' : 'outline'}
                            onClick={() =>
                              setAnnouncementForm({ ...announcementForm, type: 'SIMCHA' })
                            }
                          >
                            שמחה 🎉
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="scheduledAt">תזמון שליחה (אופציונלי)</Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          value={announcementForm.scheduledAt}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              scheduledAt: e.target.value,
                            })
                          }
                        />
                        <p className="text-sm text-gray-500 mt-1">השאר ריק לשליחה מיידית</p>
                      </div>

                      <div className="flex gap-4">
                        <Button type="submit" className="flex-1" disabled={loading}>
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
                        <Label htmlFor="eventTitle">כותרת האירוע</Label>
                        <Input
                          id="eventTitle"
                          placeholder="למשל: יום הולדת לסבתא"
                          value={eventForm.title}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="eventDescription">תיאור (אופציונלי)</Label>
                        <textarea
                          id="eventDescription"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="פרטים נוספים על האירוע..."
                          value={eventForm.description}
                          onChange={(e) =>
                            setEventForm({ ...eventForm, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startsAt">תחילת האירוע</Label>
                          <Input
                            id="startsAt"
                            type="datetime-local"
                            value={eventForm.startsAt}
                            onChange={(e) =>
                              setEventForm({ ...eventForm, startsAt: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="endsAt">סיום האירוע (אופציונלי)</Label>
                          <Input
                            id="endsAt"
                            type="datetime-local"
                            value={eventForm.endsAt}
                            onChange={(e) => setEventForm({ ...eventForm, endsAt: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="location">מיקום</Label>
                        <Input
                          id="location"
                          placeholder="כתובת או שם המקום"
                          value={eventForm.location}
                          onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>תזכורות אוטומטיות</Label>
                        <div className="flex gap-2 mt-2">
                          <span className="text-sm bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded">
                            24 שעות לפני
                          </span>
                          <span className="text-sm bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded">
                            שעה לפני
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button type="submit" className="flex-1" disabled={loading}>
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
