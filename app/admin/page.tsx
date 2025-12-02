'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bell, Calendar, MessageSquare, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'
import { Header } from '@/components/header'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'events' | 'stats'>('announcements')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { familyGroupId } = useFamilyContext()

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

      // Reset form
      setAnnouncementForm({
        title: '',
        body: '',
        type: 'GENERAL',
        scheduledAt: '',
      })
    } catch (error: any) {
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
      toast({
        title: 'שגיאה',
        description: error.message || 'נכשל ליצור אירוע',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>חברי קבוצה</CardDescription>
                <CardTitle className="text-3xl">24</CardTitle>
              </CardHeader>
              <CardContent>
                <Users className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>הודעות חודש זה</CardDescription>
                <CardTitle className="text-3xl">12</CardTitle>
              </CardHeader>
              <CardContent>
                <MessageSquare className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>אירועים קרובים</CardDescription>
                <CardTitle className="text-3xl">5</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>הודעות נשלחו היום</CardDescription>
                <CardTitle className="text-3xl">48</CardTitle>
              </CardHeader>
              <CardContent>
                <Bell className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </div>

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
                        setAnnouncementForm({ ...announcementForm, scheduledAt: e.target.value })
                      }
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      השאר ריק לשליחה מיידית
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? 'שולח...' : announcementForm.scheduledAt ? 'תזמן לשליחה' : 'שלח עכשיו'}
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
                <CardDescription>
                  תזכורות יישלחו אוטומטית לפני האירוע
                </CardDescription>
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
                        onChange={(e) => setEventForm({ ...eventForm, startsAt: e.target.value })}
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">נשלחו בהצלחה</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">היום</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">42</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">בתור</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ממתינים לשליחה</p>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">6</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">נכשלו</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">דורשים טיפול</p>
                    </div>
                    <span className="text-2xl font-bold text-red-600">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}


