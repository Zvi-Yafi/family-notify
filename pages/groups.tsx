import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { toast } from 'sonner'
import { Copy, Users, Crown, User, RefreshCw, LogOut, X, Check, AlertTriangle } from 'lucide-react'
import { PendingInvitations } from '@/components/pending-invitations'
import { useFamilyContext } from '@/lib/context/family-context'

interface Group {
  id: string
  name: string
  slug: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
}

export default function GroupsPage() {
  const router = useRouter()
  const { groups, refreshGroups, loadingGroups: loading, clearAll } = useFamilyContext()
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const [deleteWarning, setDeleteWarning] = useState<{
    groupId: string
    groupName: string
    message: string
    memberCount?: number
  } | null>(null)

  useEffect(() => {
    refreshGroups()
  }, [refreshGroups])

  const copyGroupCode = async (slug: string, name: string) => {
    try {
      await navigator.clipboard.writeText(slug)
      toast.success(`קוד הקבוצה "${name}" הועתק!`, {
        description: `שתף את הקוד: ${slug}`,
      })
    } catch (error) {
      toast.error('שגיאה בהעתקת הקוד')
    }
  }

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    try {
      setIsLeaving(true)
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.status === 409) {
        setLeavingGroupId(null)
        setDeleteWarning({
          groupId,
          groupName,
          message: data.error,
          memberCount: data.memberCount,
        })
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'נכשל בעזיבת הקבוצה')
      }

      if (data.groupDeleted) {
        toast.success(`הקבוצה "${groupName}" נמחקה בהצלחה`)
      } else {
        toast.success(`עזבת את הקבוצה "${groupName}" בהצלחה`)
      }
      await refreshGroups()
      setLeavingGroupId(null)
    } catch (error: any) {
      toast.error(error.message || 'חלה שגיאה בעזיבת הקבוצה')
    } finally {
      setIsLeaving(false)
    }
  }

  const handleConfirmDeleteAndLeave = async () => {
    if (!deleteWarning) return
    try {
      setIsLeaving(true)
      const response = await fetch(`/api/groups/${deleteWarning.groupId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmDelete: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'נכשל במחיקת הקבוצה')
      }

      toast.success(`הקבוצה "${deleteWarning.groupName}" נמחקה בהצלחה`)
      setDeleteWarning(null)
      await refreshGroups()
    } catch (error: any) {
      toast.error(error.message || 'חלה שגיאה במחיקת הקבוצה')
    } finally {
      setIsLeaving(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-yellow-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container max-w-4xl lg:max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">טוען קבוצות...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container max-w-4xl lg:max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">הקבוצות שלי</h1>
          <p className="text-sm sm:text-base text-gray-600">
            כאן תוכל לראות את כל הקבוצות שאתה חבר בהן ולשתף את קוד הקבוצה עם אחרים
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <PendingInvitations />
          {groups.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshGroups()}
                className="text-gray-500 gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                רענן רשימה
              </Button>
            </div>
          )}
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">אין לך קבוצות עדיין</h3>
              <p className="text-gray-600 mb-4">צור קבוצה חדשה או הצטרף לקבוצה קיימת</p>
              <Button onClick={() => router.push('/onboarding')}>הצטרף לקבוצה</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-1">{group.name}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        {getRoleIcon(group.role)}
                        <span>{getRoleLabel(group.role)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="break-words">
                          הצטרפת ב-
                          {new Date(group.joinedAt || Date.now()).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">קוד הקבוצה</p>
                        <code className="text-base sm:text-lg font-mono font-semibold text-primary break-all">
                          {group.slug}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyGroupCode(group.slug, group.name)}
                        className="gap-2 w-full sm:w-auto touch-target flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                        העתק קוד
                      </Button>

                      {leavingGroupId === group.id ? (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 p-1 rounded-md border border-red-100 dark:border-red-900/20">
                          <span className="text-[10px] sm:text-xs text-red-600 font-medium px-2">
                            בטוח?
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-[10px] sm:text-xs"
                            onClick={() => handleLeaveGroup(group.id, group.name)}
                            disabled={isLeaving}
                          >
                            {isLeaving ? 'עוזב...' : 'כן, עזוב'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => setLeavingGroupId(null)}
                            disabled={isLeaving}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setLeavingGroupId(group.id)}
                        >
                          <LogOut className="h-4 w-4" />
                          עזוב קבוצה
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      שתף את הקוד הזה עם חברי משפחה או חברים כדי שיוכלו להצטרף לקבוצה
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 sm:mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/onboarding')}
            className="gap-2 w-full sm:w-auto touch-target"
          >
            <Users className="h-4 w-4" />
            הצטרף לקבוצה נוספת
          </Button>
        </div>

        {deleteWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">מחיקת קבוצה</CardTitle>
                </div>
                <CardDescription className="text-right mt-2">
                  {deleteWarning.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                    מה יימחק:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                    <li>כל ההודעות שנשלחו בקבוצה</li>
                    <li>כל האירועים והתזכורות</li>
                    {deleteWarning.memberCount && deleteWarning.memberCount > 0 && (
                      <li>{deleteWarning.memberCount} חברים יוסרו מהקבוצה</li>
                    )}
                    <li>כל ההזמנות הפעילות</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600 mb-4 font-semibold">
                  פעולה זו אינה ניתנת לביטול!
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteWarning(null)}
                    disabled={isLeaving}
                  >
                    ביטול
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDeleteAndLeave}
                    disabled={isLeaving}
                  >
                    {isLeaving ? 'מוחק...' : 'עזוב ומחק קבוצה'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
