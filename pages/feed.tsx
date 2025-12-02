import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'
import { Header } from '@/components/header'

interface Announcement {
  id: string
  title: string
  body: string
  type: 'GENERAL' | 'SIMCHA'
  createdAt: Date
  creator: { email: string }
}

export default function FeedPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const { familyGroupId } = useFamilyContext()

  useEffect(() => {
    async function loadAnnouncements() {
      if (!familyGroupId) {
        setLoading(false)
        return
      }

      try {
        const data = await apiClient.getAnnouncements(familyGroupId)
        setAnnouncements(
          data.announcements.map((a) => ({
            ...a,
            createdAt: new Date(a.createdAt),
          }))
        )
      } catch (error) {
        console.error('Failed to load announcements:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnnouncements()
  }, [familyGroupId])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">פיד הודעות</h2>
              <p className="text-gray-600 dark:text-gray-400">
                כל ההודעות והשמחות האחרונות מהמשפחה
              </p>
            </div>
            <Button asChild>
              <Link href="/admin">הוסף הודעה</Link>
            </Button>
          </div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">טוען הודעות...</p>
            </div>
          )}

          {!loading && !familyGroupId && (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  עדיין לא הצטרפת לקבוצה משפחתית
                </p>
                <Button asChild>
                  <Link href="/onboarding">הרשם עכשיו</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && familyGroupId && announcements.length > 0 && (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                        <CardDescription>
                          פורסם על ידי {announcement.creator.email} •{' '}
                          {announcement.createdAt.toLocaleDateString('he-IL')}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          announcement.type === 'SIMCHA'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}
                      >
                        {announcement.type === 'SIMCHA' ? 'שמחה' : 'כללי'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {announcement.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && familyGroupId && announcements.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">אין הודעות חדשות</p>
                <Button asChild>
                  <Link href="/admin">פרסם הודעה ראשונה</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
