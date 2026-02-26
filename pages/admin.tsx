import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import NextImage from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { event as gaEvent } from '@/lib/analytics'
import {
  Bell,
  Calendar,
  MessageSquare,
  Users,
  Loader2,
  X,
  Crown,
  User as UserIcon,
  Settings,
  Info,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  AlertTriangle,
  Mail,
  Send,
  Plus,
  Smartphone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { apiClient, UnauthorizedError } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'
import { Header } from '@/components/header'
import { GroupSelector } from '@/components/group-selector'
import { StrictDateTimePicker } from '@/components/strict-date-time-picker'
import { roundToTenMinutes } from '@/lib/utils/time-utils'
import { getHebrewDateString } from '@/lib/utils/hebrew-date-utils'
import { MultiEmailInput } from '@/components/multi-email-input'
import { MessageCircle, Copy, CheckCircle2 } from 'lucide-react'

interface Stats {
  memberCount: number
  announcementsThisMonth: number
  scheduledAnnouncements: number
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
  email: string | null
  name: string | null
  phone: string | null
  role: string
  joinedAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<
    'announcements' | 'events' | 'stats' | 'settings' | 'invitations' | 'addMember'
  >('announcements')

  // Set active tab from query param
  useEffect(() => {
    if (
      router.query.tab &&
      ['announcements', 'events', 'stats', 'settings', 'invitations', 'addMember'].includes(
        router.query.tab as string
      )
    ) {
      setActiveTab(router.query.tab as any)
    }
  }, [router.query.tab])

  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    memberCount: 0,
    announcementsThisMonth: 0,
    scheduledAnnouncements: 0,
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
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [removingMember, setRemovingMember] = useState(false)
  const { toast } = useToast()
  const { familyGroupId, userId, groups, loadingGroups, selectedGroup } = useFamilyContext()

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    type: 'GENERAL' as 'GENERAL' | 'SIMCHA',
    scheduledAt: '',
    sendMode: 'now' as 'now' | 'scheduled' | 'both',
  })

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
    reminderMessage: '',
    reminderScheduledAt: '',
    imageUrl: '',
    fileUrl: '',
    notifyMode: 'now' as 'now' | 'scheduled' | 'both',
  })

  const [uploading, setUploading] = useState(false)

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    slug: '',
  })

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  // Invitations state
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  const [copied, setCopied] = useState(false)

  // Direct member addition state
  const [addMemberForm, setAddMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: Math.floor(100000 + Math.random() * 900000).toString(),
    channel: 'EMAIL' as 'EMAIL' | 'WHATSAPP' | 'SMS',
  })

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPhone = (phone: string) => phone.trim().length >= 9

  // Auto-switch channel if current becomes invalid
  useEffect(() => {
    if (activeTab !== 'addMember') return

    const emailValid = isValidEmail(addMemberForm.email)
    const phoneValid = isValidPhone(addMemberForm.phone)

    if (addMemberForm.channel === 'EMAIL' && !emailValid && phoneValid) {
      setAddMemberForm((prev) => ({ ...prev, channel: 'WHATSAPP' }))
    } else if (
      (addMemberForm.channel === 'WHATSAPP' || addMemberForm.channel === 'SMS') &&
      !phoneValid &&
      emailValid
    ) {
      setAddMemberForm((prev) => ({ ...prev, channel: 'EMAIL' }))
    }
  }, [addMemberForm.email, addMemberForm.phone, activeTab, addMemberForm.channel])

  // Populate settings form when group changes
  useEffect(() => {
    if (selectedGroup) {
      setSettingsForm({
        name: selectedGroup.name || '',
        slug: selectedGroup.slug || '',
      })
    }
  }, [selectedGroup])

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
        description: 'לא הצלחנו לטעון את רשימת החברים. אנא נסה שוב.',
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

  const handleRemoveMember = async () => {
    if (!familyGroupId || !memberToRemove) return

    const memberDisplayName =
      memberToRemove.name || memberToRemove.email?.split('@')[0] || 'החבר'

    setRemovingMember(true)
    try {
      const response = await fetch(`/api/groups/${familyGroupId}/remove-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberToRemove.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorTitles: Record<string, string> = {
          AUTH_REQUIRED: 'נדרשת התחברות',
          PERMISSION_DENIED: 'אין הרשאה',
          MEMBER_NOT_FOUND: 'החבר לא נמצא',
          LAST_ADMIN: 'לא ניתן להסיר מנהל יחיד',
          SELF_REMOVAL: 'לא ניתן להסיר את עצמך',
          INVALID_REQUEST: 'בקשה לא תקינה',
          SERVER_ERROR: 'שגיאת שרת',
        }

        toast({
          title: errorTitles[data.code] || 'שגיאה בהסרת החבר',
          description: data.error || 'אירעה שגיאה בלתי צפויה. אנא נסה שוב.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'החבר הוסר בהצלחה',
        description: data.message || `${memberDisplayName} הוסר מהקבוצה`,
      })

      setShowRemoveMemberDialog(false)
      setMemberToRemove(null)
      loadMembers()
      loadStats()
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast({
          title: 'בעיית תקשורת',
          description: 'לא ניתן להתחבר לשרת. בדוק את חיבור האינטרנט ונסה שוב.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'שגיאה בלתי צפויה',
          description: `לא הצלחנו להסיר את ${memberDisplayName}. אנא רענן את הדף ונסה שוב.`,
          variant: 'destructive',
        })
      }
    } finally {
      setRemovingMember(false)
    }
  }

  const loadInvitations = useCallback(async () => {
    if (!familyGroupId) return

    try {
      setLoadingInvitations(true)
      const data = await apiClient.getInvitations(familyGroupId)
      setInvitations(data.invitations)
    } catch (error) {
      console.error('Failed to load invitations:', error)
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את רשימת ההזמנות. אנא רענן את הדף.',
        variant: 'destructive',
      })
    } finally {
      setLoadingInvitations(false)
    }
  }, [familyGroupId, toast])

  useEffect(() => {
    if (activeTab === 'invitations') {
      loadInvitations()
    }
  }, [activeTab, loadInvitations])

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyGroupId || emailsToInvite.length === 0) return

    setLoading(true)
    try {
      const response = await apiClient.sendInvitations(familyGroupId, emailsToInvite)

      const successes = response.results.filter((r: any) => r.status === 'success')
      const failures = response.results.filter((r: any) => r.status === 'error')

      if (successes.length > 0) {
        toast({
          title: 'הזמנות נשלחו',
          description: `${successes.length} הזמנות נשלחו בהצלחה`,
        })
        gaEvent('send_invitation', { count: successes.length })
        setEmailsToInvite([])
        loadInvitations()
      }

      if (failures.length > 0) {
        toast({
          title: 'חלק מההזמנות נכשלו',
          description: `${failures.length} שגיאות: ${failures.map((f: any) => f.message).join(', ')}`,
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: 'שליחת ההזמנות נכשלה. אנא וודא שכתובות המייל תקינות.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInviteLink = () => {
    if (!selectedGroup) return
    const baseUrl = window.location.origin
    const inviteLink = `${baseUrl}/onboarding?slug=${selectedGroup.slug}`

    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: 'הקישור הועתק',
      description: 'קישור להצטרפות הועתק ללוח',
    })
  }

  const handleWhatsAppInvite = () => {
    if (!selectedGroup) return
    const baseUrl = window.location.origin
    const inviteLink = `${baseUrl}/onboarding?slug=${selectedGroup.slug}`
    const text = `היי! אני מזמין אותך להצטרף לקבוצת "${selectedGroup.name}" ב-FamilyNotify. \n\nלחץ על הקישור כדי להצטרף: \n${inviteLink}`
    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyGroupId) return

    setLoading(true)
    try {
      const response = await apiClient.updateGroup(familyGroupId, {
        name: settingsForm.name,
        slug: settingsForm.slug,
      })

      if (response.success) {
        toast({
          title: 'הגדרות עודכנו',
          description: 'פרטי הקבוצה עודכנו בהצלחה',
        })
        // Refresh page to update context and URL if slug changed
        window.location.reload()
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לעדכן את פרטי הקבוצה. אנא נסה שוב.',
        variant: 'destructive',
      })
    } finally {
      setLoading(true)
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup || deleteConfirmation !== selectedGroup.name) {
      toast({
        title: 'שגיאה',
        description: 'יש להקליד את שם הקבוצה בדיוק כדי לאשר מחיקה',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const result = await apiClient.deleteGroup(selectedGroup.id)
      toast({
        title: 'הקבוצה נמחקה בהצלחה',
        description: `הקבוצה "${result.deletedGroup.name}" נמחקה יחד עם ${result.deletedGroup.memberCount} חברים, ${result.deletedGroup.eventCount} אירועים ו-${result.deletedGroup.announcementCount} הודעות.`,
      })
      // Redirect to home
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו למחוק את הקבוצה. אנא נסה שוב מאוחר יותר.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
      setDeleteConfirmation('')
    }
  }

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyGroupId || !addMemberForm.name) return
    if (!addMemberForm.email && !addMemberForm.phone) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין לפחות מייל או מספר טלפון',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const memberData: any = {
        familyGroupId,
        name: addMemberForm.name,
        channel: addMemberForm.channel,
        password: addMemberForm.password,
      }
      if (addMemberForm.email) memberData.email = addMemberForm.email
      if (addMemberForm.phone) memberData.phone = addMemberForm.phone

      await apiClient.addMember(memberData)

      toast({
        title: 'חבר נוסף בהצלחה',
        description: `החבר ${addMemberForm.name} נוסף לקבוצה ונשלחה אליו הודעת ברוך הבא עם פרטי התחברות.`,
      })

      setAddMemberForm({
        name: '',
        email: '',
        phone: '',
        password: Math.floor(100000 + Math.random() * 900000).toString(),
        channel: 'EMAIL',
      })

      // Reload members and stats
      loadMembers()
      loadStats()

      // Switch to invitations tab to see the updated member count or just stay here
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'הוספת החבר נכשלה. אנא וודא שהפרטים תקינים.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-yellow-500" />
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'מנהל'
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
      setTimeout(() => {
        window.location.href = '/onboarding'
      }, 2000)
      return
    }



    if (announcementForm.sendMode !== 'now' && !announcementForm.scheduledAt) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור תאריך ושעה לתזמון',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const sendNow = announcementForm.sendMode === 'now' || announcementForm.sendMode === 'both'
      const scheduledAt =
        announcementForm.sendMode === 'scheduled' || announcementForm.sendMode === 'both'
          ? announcementForm.scheduledAt
          : undefined

      await apiClient.createAnnouncement({
        title: announcementForm.title,
        bodyText: announcementForm.body,
        type: announcementForm.type,
        familyGroupId,
        sendNow,
        scheduledAt,
      })

      const toastMessages = {
        now: { title: 'ההודעה נשלחה בהצלחה!', description: 'ההודעה נשלחה לכל חברי הקבוצה' },
        scheduled: {
          title: 'ההודעה תוזמנה בהצלחה!',
          description: `ההודעה תישלח ב-${new Date(announcementForm.scheduledAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        },
        both: {
          title: 'ההודעה נשלחה ותוזמנה!',
          description: `ההודעה נשלחה עכשיו וגם תישלח שוב ב-${new Date(announcementForm.scheduledAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        },
      }

      toast(toastMessages[announcementForm.sendMode])

      gaEvent('create_announcement', {
        send_mode: announcementForm.sendMode,
        type: announcementForm.type,
      })

      await loadStats()

      setAnnouncementForm({
        title: '',
        body: '',
        type: 'GENERAL',
        scheduledAt: '',
        sendMode: 'now',
      })
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        return
      }
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו ליצור את ההודעה. אנא וודא שכל השדות מלאים.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !familyGroupId) return

    setUploading(true)
    const supabase = createClient()

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `events/${familyGroupId}/${Date.now()}_${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('event-attachments')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('event-attachments').getPublicUrl(filePath)

      if (file.type.startsWith('image/')) {
        setEventForm((prev) => ({ ...prev, imageUrl: publicUrl }))
      } else {
        setEventForm((prev) => ({ ...prev, fileUrl: publicUrl }))
      }

      toast({
        title: 'קובץ הועלה',
        description: 'הקובץ נשמר בהצלחה',
      })
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast({
        title: 'שגיאה בהעלאה',
        description: 'לא הצלחנו להעלות את הקובץ. אנא וודא שהקובץ תקין ונסה שוב.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
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
      setTimeout(() => {
        window.location.href = '/onboarding'
      }, 2000)
      return
    }

    if (eventForm.notifyMode !== 'now' && !eventForm.reminderScheduledAt) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור תאריך ושעה לתזמון ההודעה',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const eventResponse = await apiClient.createEvent({
        title: eventForm.title,
        description: eventForm.description || undefined,
        startsAt: eventForm.startsAt,
        endsAt: eventForm.endsAt || undefined,
        location: eventForm.location || undefined,
        familyGroupId,
        imageUrl: eventForm.imageUrl || undefined,
        fileUrl: eventForm.fileUrl || undefined,
      })

      const eventId = eventResponse.event.id

      const createReminder = async (scheduledAt: string | null, message: string) => {
        try {
          const reminderResponse = await fetch('/api/admin/event-reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId,
              message,
              scheduledAt,
            }),
          })
          if (!reminderResponse.ok) {
            throw new Error('Failed to create reminder')
          }
          const reminderData = await reminderResponse.json()
          return reminderData.reminder?.id as string | undefined
        } catch (reminderError) {
          console.error('Failed to create reminder:', reminderError)
          return undefined
        }
      }

      if (eventForm.notifyMode === 'now') {
        await createReminder(null, '')
      } else if (eventForm.notifyMode === 'scheduled') {
        await createReminder(eventForm.reminderScheduledAt, eventForm.reminderMessage || '')
      } else {
        await createReminder(null, '')
        await createReminder(eventForm.reminderScheduledAt, eventForm.reminderMessage || '')
      }

      const toastMessages = {
        now: {
          title: 'האירוע נוצר בהצלחה!',
          description: 'האירוע נוצר ונשלחה הודעה לחברים',
        },
        scheduled: {
          title: 'האירוע נוצר בהצלחה!',
          description: `האירוע נוצר והתזכורת תישלח ב-${new Date(eventForm.reminderScheduledAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        },
        both: {
          title: 'האירוע נוצר בהצלחה!',
          description: `נשלחה הודעה לחברים וגם תזכורת תישלח ב-${new Date(eventForm.reminderScheduledAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        },
      }

      toast(toastMessages[eventForm.notifyMode])

      gaEvent('create_event', { notify_mode: eventForm.notifyMode })

      await loadStats()

      router.push('/events')
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        return
      }
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו ליצור את האירוע. אנא וודא שהפרטים תקינים.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl lg:max-w-7xl mx-auto text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto text-blue-600 mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">טוען קבוצות...</p>
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
        <div className="max-w-5xl lg:max-w-7xl mx-auto">
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

          {selectedGroup && groups.length > 1 && familyGroupId && (
            <div className="sticky top-16 z-10 mb-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    אתה שולח לקבוצה: <strong>{selectedGroup.name}</strong>
                    {stats.memberCount > 0 && (
                      <span className="text-amber-600 dark:text-amber-300">
                        {' '}({stats.memberCount} חברים)
                      </span>
                    )}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  החלף קבוצה
                </Button>
              </div>
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

              {showMembersDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                  <Card className="w-full max-w-2xl h-[85vh] sm:h-auto sm:max-h-[80vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-lg">
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
                            const displayName =
                              member.name ||
                              (member.email ? member.email.split('@')[0] : member.phone || 'משתמש')

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
                                    <p className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 truncate">
                                      {displayName}
                                    </p>

                                    {member.email && (
                                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                        📧 {member.email}
                                      </p>
                                    )}

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
                                  {selectedGroup?.role === 'ADMIN' && member.id !== userId && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => {
                                        setMemberToRemove(member)
                                        setShowRemoveMemberDialog(true)
                                      }}
                                      aria-label="הסר חבר"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
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

              {showRemoveMemberDialog && memberToRemove && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        הסרת חבר מהקבוצה
                      </CardTitle>
                      <CardDescription>
                        האם אתה בטוח שברצונך להסיר את החבר מהקבוצה?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {memberToRemove.name || memberToRemove.email?.split('@')[0] || 'משתמש'}
                            </p>
                            {memberToRemove.email && (
                              <p className="text-sm text-gray-500">{memberToRemove.email}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              {getRoleIcon(memberToRemove.role)}
                              <span className="text-xs text-gray-500">
                                {getRoleLabel(memberToRemove.role)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {memberToRemove.role === 'ADMIN' && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Crown className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <strong>שים לב:</strong> חבר זה הוא מנהל. הסרתו תסיר את הרשאות הניהול שלו מהקבוצה.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          לאחר ההסרה, החבר לא יקבל יותר הודעות ועדכונים מהקבוצה. הוא יוכל להצטרף מחדש רק דרך הזמנה חדשה.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRemoveMemberDialog(false)
                          setMemberToRemove(null)
                        }}
                        className="flex-1"
                        disabled={removingMember}
                      >
                        ביטול
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleRemoveMember}
                        disabled={removingMember}
                        className="flex-1"
                      >
                        {removingMember ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 ml-2" />
                            הסר חבר
                          </>
                        )}
                      </Button>
                    </CardFooter>
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
                {selectedGroup?.role === 'ADMIN' && (
                  <Button
                    variant={activeTab === 'invitations' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('invitations')}
                    className="w-full sm:w-auto touch-target justify-center"
                  >
                    <Mail className="h-4 w-4 ml-2" />
                    הזמנות
                  </Button>
                )}
                {selectedGroup?.role === 'ADMIN' && (
                  <Button
                    variant={activeTab === 'addMember' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('addMember')}
                    className="w-full sm:w-auto touch-target justify-center"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף חבר
                  </Button>
                )}
                {selectedGroup?.role === 'ADMIN' && (
                  <Button
                    variant={activeTab === 'settings' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('settings')}
                    className="w-full sm:w-auto touch-target justify-center"
                  >
                    <Settings className="h-4 w-4 ml-2" />
                    הגדרות קבוצה
                  </Button>
                )}
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

                      <div className="border-t pt-4 mt-4">
                        <Label className="text-sm sm:text-base font-semibold mb-3 block">
                          מתי לשלוח?
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                          {([
                            { value: 'now', label: 'שלח עכשיו', icon: Send },
                            { value: 'scheduled', label: 'תזמן לשליחה', icon: Calendar },
                            { value: 'both', label: 'שלח עכשיו + תזמן שוב', icon: Bell },
                          ] as const).map(({ value, label, icon: Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setAnnouncementForm((prev) => ({
                                  ...prev,
                                  sendMode: value,
                                  scheduledAt: value === 'now' ? '' : prev.scheduledAt,
                                }))
                              }
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                                announcementForm.sendMode === value
                                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500'
                                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                              }`}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>

                        {announcementForm.sendMode !== 'now' && (
                          <div className="space-y-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <StrictDateTimePicker
                              id="scheduledAt"
                              label={
                                announcementForm.sendMode === 'both'
                                  ? 'מתי לשלוח שוב?'
                                  : 'מתי לשלוח?'
                              }
                              value={announcementForm.scheduledAt}
                              onChange={(val) =>
                                setAnnouncementForm({ ...announcementForm, scheduledAt: val })
                              }
                              required
                              helperText="הזמן יוגבל לקפיצות של 10 דקות"
                            />
                            {announcementForm.scheduledAt && (
                              <div className="text-sm font-semibold text-blue-600">
                                תאריך עברי:{' '}
                                {getHebrewDateString(new Date(announcementForm.scheduledAt))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button type="submit" className="flex-1 touch-target" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                              שולח
                            </>
                          ) : announcementForm.sendMode === 'now' ? (
                            'שולח'
                          ) : announcementForm.sendMode === 'scheduled' ? (
                            'תזמן לשליחה'
                          ) : (
                            'שלח עכשיו ותזמן'
                          )}
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
                              sendMode: 'now',
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

                      <div className="space-y-3">
                        <Label className="text-sm sm:text-base">
                          הוסף תמונה או קובץ (אופציונלי)
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="relative flex-1">
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="hidden"
                              id="file-upload"
                            />
                            <Label
                              htmlFor="file-upload"
                              className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {uploading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Paperclip className="h-5 w-5" />
                              )}
                              <span>{uploading ? 'מעלה...' : 'בחר תמונה או PDF'}</span>
                            </Label>
                          </div>

                          {eventForm.imageUrl && (
                            <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden border">
                              <NextImage
                                src={eventForm.imageUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => setEventForm((prev) => ({ ...prev, imageUrl: '' }))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {eventForm.fileUrl && (
                            <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <Paperclip className="h-5 w-5 text-blue-600" />
                              <span className="text-sm truncate max-w-[150px]">PDF הועלה</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500"
                                onClick={() => setEventForm((prev) => ({ ...prev, fileUrl: '' }))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <StrictDateTimePicker
                            id="startsAt"
                            label="תחילת האירוע"
                            value={eventForm.startsAt}
                            onChange={(val) => setEventForm({ ...eventForm, startsAt: val })}
                            required
                            helperText="הזמן יעוגל אוטומטית לקפיצות של 10 דקות"
                          />
                          {eventForm.startsAt && (
                            <div className="text-sm font-semibold text-blue-600">
                              תאריך עברי: {getHebrewDateString(new Date(eventForm.startsAt))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <StrictDateTimePicker
                            id="endsAt"
                            label="סיום האירוע (אופציונלי)"
                            value={eventForm.endsAt}
                            onChange={(val) => setEventForm({ ...eventForm, endsAt: val })}
                            helperText="הזמן יעוגל אוטומטית לקפיצות של 10 דקות"
                          />
                          {eventForm.endsAt && (
                            <div className="text-sm font-semibold text-blue-600">
                              תאריך עברי: {getHebrewDateString(new Date(eventForm.endsAt))}
                            </div>
                          )}
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

                      <div className="border-t pt-4 mt-4">
                        <Label className="text-sm sm:text-base font-semibold mb-3 block">
                          מתי להודיע לחברים?
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                          {([
                            { value: 'now', label: 'שלח הודעה עכשיו', icon: Send },
                            { value: 'scheduled', label: 'תזמן הודעה', icon: Calendar },
                            { value: 'both', label: 'שלח עכשיו + תזמן תזכורת', icon: Bell },
                          ] as const).map(({ value, label, icon: Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setEventForm((prev) => ({
                                  ...prev,
                                  notifyMode: value,
                                  reminderScheduledAt: value === 'now' ? '' : prev.reminderScheduledAt,
                                  reminderMessage: value === 'now' ? '' : prev.reminderMessage,
                                }))
                              }
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                                eventForm.notifyMode === value
                                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500'
                                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                              }`}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>

                        {eventForm.notifyMode !== 'now' && (
                          <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div>
                              <Label htmlFor="reminderMessage" className="text-sm sm:text-base">
                                הודעת התזכורת (אופציונלי)
                              </Label>
                              <textarea
                                id="reminderMessage"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="למשל: תזכורת! יום הולדת לסבתא מתקרב..."
                                value={eventForm.reminderMessage}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, reminderMessage: e.target.value })
                                }
                              />
                            </div>

                            <StrictDateTimePicker
                              id="reminderScheduledAt"
                              label={
                                eventForm.notifyMode === 'both'
                                  ? 'מתי לשלוח תזכורת?'
                                  : 'מתי לשלוח?'
                              }
                              value={eventForm.reminderScheduledAt}
                              onChange={(val) =>
                                setEventForm({ ...eventForm, reminderScheduledAt: val })
                              }
                              required
                              helperText="הזמן יוגבל לקפיצות של 10 דקות"
                            />
                            {eventForm.reminderScheduledAt && (
                              <div className="text-sm font-semibold text-blue-600">
                                תאריך עברי:{' '}
                                {getHebrewDateString(new Date(eventForm.reminderScheduledAt))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button type="submit" className="flex-1 touch-target" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                              שולח
                            </>
                          ) : eventForm.notifyMode === 'now' ? (
                            'צור אירוע ושלח עכשיו'
                          ) : eventForm.notifyMode === 'scheduled' ? (
                            'צור אירוע ותזמן הודעה'
                          ) : (
                            'צור אירוע, שלח ותזמן'
                          )}
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
                              reminderMessage: '',
                              reminderScheduledAt: '',
                              imageUrl: '',
                              fileUrl: '',
                              notifyMode: 'now',
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

              {/* Invitations Tab */}
              {activeTab === 'invitations' && (
                <Card>
                  <CardHeader>
                    <CardTitle>הזמנת חברים</CardTitle>
                    <CardDescription>שלח הזמנות לחברים ובני משפחה להצטרף לקבוצה</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Email Invitations Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 italic">
                            הזמנה במייל
                          </h3>
                        </div>
                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <Label htmlFor="emails" className="mb-3 block text-sm font-medium">
                              הוסף כתובות מייל להזמנה
                            </Label>
                            <MultiEmailInput
                              emails={emailsToInvite}
                              onChange={setEmailsToInvite}
                              placeholder="example@mail.com"
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={loading || emailsToInvite.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 h-11"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 ml-2" />
                                שלח {emailsToInvite.length > 0 ? `${emailsToInvite.length} ` : ''}
                                הזמנות במייל
                              </>
                            )}
                          </Button>
                        </form>
                      </div>

                      {/* WhatsApp & Link Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 italic">
                            שיתוף בקישור
                          </h3>
                        </div>
                        <div className="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-xl border border-green-100 dark:border-green-900/30 space-y-4">
                          <p className="text-sm text-green-800 dark:text-green-300">
                            שתף קישור הזמנה ישיר בוואצאפ או העתק אותו לשליחה בכל מקום אחר.
                          </p>

                          <div className="grid grid-cols-1 gap-3">
                            <Button
                              type="button"
                              onClick={handleWhatsAppInvite}
                              className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-none font-bold h-12 shadow-md hover:shadow-lg transition-all"
                            >
                              <MessageCircle className="h-5 w-5 ml-2" />
                              שלח הזמנה בוואצאפ
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCopyInviteLink}
                              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-12 font-medium"
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 className="h-5 w-5 ml-2 text-green-600" />
                                  הועתק!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-5 w-5 ml-2" />
                                  העתק קישור להצטרפות
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4 text-sm text-gray-700 dark:text-gray-300">
                        הזמנות שנשלחו
                      </h3>
                      {loadingInvitations ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : invitations.length === 0 ? (
                        <p className="text-gray-500 text-sm">לא נשלחו הזמנות עדיין</p>
                      ) : (
                        <div className="space-y-2">
                          {invitations.map((inv: any) => (
                            <div
                              key={inv.id}
                              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm gap-2"
                            >
                              <div>
                                <p className="font-medium">{inv.email}</p>
                                <p className="text-xs text-gray-500">
                                  נשלח ע&quot;י {inv.inviter?.name || 'Unknown'} ב-
                                  {new Date(inv.createdAt).toLocaleDateString('he-IL')}
                                </p>
                              </div>
                              <div>
                                {inv.status === 'PENDING' && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    ממתין
                                  </span>
                                )}
                                {inv.status === 'ACCEPTED' && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    אושר ({inv.acceptedBy?.name})
                                  </span>
                                )}
                                {inv.status === 'EXPIRED' && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                    פג תוקף
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Member Tab */}
              {activeTab === 'addMember' &&
                selectedGroup?.role === 'ADMIN' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>הוספת חבר לקבוצה</CardTitle>
                      <CardDescription>
                        הוסף חבר ישירות לקבוצה ולאתר. ההודעה תישלח אליו בערוץ הנבחר.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddMemberSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="memberName">שם מלא</Label>
                            <Input
                              id="memberName"
                              placeholder="ישראל ישראלי"
                              value={addMemberForm.name}
                              onChange={(e) =>
                                setAddMemberForm({ ...addMemberForm, name: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="memberEmail">כתובת מייל</Label>
                            <Input
                              id="memberEmail"
                              type="email"
                              placeholder="israel@example.com"
                              value={addMemberForm.email}
                              onChange={(e) =>
                                setAddMemberForm({ ...addMemberForm, email: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="memberPhone">טלפון (אופציונלי)</Label>
                            <Input
                              id="memberPhone"
                              placeholder="050-1234567"
                              value={addMemberForm.phone}
                              onChange={(e) =>
                                setAddMemberForm({ ...addMemberForm, phone: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="memberPassword">
                              סיסמת התחברות (6 ספרות רנדומליות)
                            </Label>
                            <div className="relative">
                              <Input
                                id="memberPassword"
                                value={addMemberForm.password}
                                onChange={(e) =>
                                  setAddMemberForm({ ...addMemberForm, password: e.target.value })
                                }
                                required
                                className="pl-24"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute left-0 top-0 h-full px-3 text-xs"
                                onClick={() =>
                                  setAddMemberForm({
                                    ...addMemberForm,
                                    password: Math.floor(
                                      100000 + Math.random() * 900000
                                    ).toString(),
                                  })
                                }
                              >
                                ייצר חדש
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>ערוץ תקשורת מועדף</Label>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant={addMemberForm.channel === 'EMAIL' ? 'default' : 'outline'}
                                onClick={() =>
                                  setAddMemberForm({ ...addMemberForm, channel: 'EMAIL' })
                                }
                                disabled={!isValidEmail(addMemberForm.email)}
                                className="flex-1 min-w-[100px]"
                              >
                                <Mail className="h-4 w-4 ml-2" />
                                מייל
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  addMemberForm.channel === 'WHATSAPP' ? 'default' : 'outline'
                                }
                                onClick={() =>
                                  setAddMemberForm({ ...addMemberForm, channel: 'WHATSAPP' })
                                }
                                disabled={!isValidPhone(addMemberForm.phone)}
                                className="flex-1 min-w-[100px] border-green-200 hover:bg-green-50 text-green-700 data-[variant=default]:bg-green-600 data-[variant=default]:text-white data-[variant=default]:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={
                                  addMemberForm.channel === 'WHATSAPP' &&
                                  isValidPhone(addMemberForm.phone)
                                    ? { backgroundColor: '#25D366', color: 'white' }
                                    : {}
                                }
                              >
                                <MessageCircle className="h-4 w-4 ml-2" />
                                WhatsApp
                              </Button>
                              <Button
                                type="button"
                                variant={addMemberForm.channel === 'SMS' ? 'default' : 'outline'}
                                onClick={() =>
                                  setAddMemberForm({ ...addMemberForm, channel: 'SMS' })
                                }
                                disabled={!isValidPhone(addMemberForm.phone)}
                                className="flex-1 min-w-[100px]"
                              >
                                <Smartphone className="h-4 w-4 ml-2" />
                                SMS
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-3 text-blue-800 dark:text-blue-300">
                            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-bold mb-1">טיפ חשוב</p>
                              <p>
                                החבר יתווסף לקבוצה באופן מיידי. כשיכנס לאתר עם המייל שהזנת, הוא יראה
                                שהוא כבר מחובר לקבוצה ולא יצטרך להירשם מחדש.
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full h-11">
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <Plus className="h-4 w-4 ml-2" />
                          )}
                          הוסף חבר ושלח הודעת ברוך הבא
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

              {/* Settings Tab */}
              {activeTab === 'settings' && selectedGroup?.role === 'ADMIN' && (
                <Card>
                  <CardHeader>
                    <CardTitle>הגדרות קבוצה</CardTitle>
                    <CardDescription>
                      ערוך את פרטי הקבוצה. שים לב ששינוי קוד הקבוצה ישבור קישורי הצטרפות קיימים.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSettingsSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="groupName">שם הקבוצה</Label>
                        <Input
                          id="groupName"
                          value={settingsForm.name}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, name: e.target.value })
                          }
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="groupSlug">קוד קבוצה (Slug)</Label>
                        <Input
                          id="groupSlug"
                          value={settingsForm.slug}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, slug: e.target.value })
                          }
                          required
                          className="mt-1"
                        />
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mt-4 space-y-3">
                          <div className="flex items-start gap-2 text-blue-800 dark:text-blue-300">
                            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-bold mb-1">מה ההבדל בין שם לקוד?</p>
                              <div className="space-y-2">
                                <p>
                                  <strong>שם הקבוצה:</strong> השם לתצוגה (למשל: &quot;משפחת כהן
                                  המורחבת&quot;). מותר עברית ורווחים. שינוי השם אינו שובר קישורים.
                                </p>
                                <p>
                                  <strong>קוד הקבוצה (Slug):</strong> המזהה בקישור (למשל:{' '}
                                  <code>cohen-family</code>). רק אנגלית, מספרים ומקפים.
                                </p>
                                <p className="text-yellow-600 dark:text-yellow-500 font-bold">
                                  ⚠️ שים לב: שינוי הקוד ישבור קישורי הצטרפות קיימים שנשלחו בעבר!
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור שינויים'}
                      </Button>
                    </form>

                    {/* Danger Zone */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                      <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          אזור סכנה
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                          פעולות בלתי הפיכות. אנא היה זהיר!
                        </p>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setShowDeleteDialog(true)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          מחק קבוצה לצמיתות
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delete Confirmation Dialog */}
              {showDeleteDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        אישור מחיקת קבוצה
                      </CardTitle>
                      <CardDescription>
                        פעולה זו תמחק לצמיתות את הקבוצה ואת כל הנתונים הקשורים אליה
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                          מה יימחק:
                        </p>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                          <li>כל חברי הקבוצה ({stats.memberCount} חברים)</li>
                          <li>כל האירועים והתזכורות</li>
                          <li>כל ההודעות ({stats.announcementsThisMonth} הודעות החודש)</li>
                          <li>כל הנושאים והנתונים</li>
                        </ul>
                      </div>

                      <div>
                        <Label htmlFor="deleteConfirm" className="text-sm font-semibold">
                          הקלד את שם הקבוצה &quot;{selectedGroup?.name}&quot; לאישור:
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder={selectedGroup?.name}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteDialog(false)
                          setDeleteConfirmation('')
                        }}
                        className="flex-1"
                      >
                        ביטול
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteGroup}
                        disabled={deleteConfirmation !== selectedGroup?.name || loading}
                        className="flex-1"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 ml-2" />
                            מחק לצמיתות
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
