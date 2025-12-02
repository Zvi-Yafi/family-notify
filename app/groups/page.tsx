'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { toast } from 'sonner'
import { Copy, Users, Crown, Edit, User } from 'lucide-react'

interface Group {
  id: string
  name: string
  slug: string
  role: 'ADMIN' | 'EDITOR' | 'MEMBER'
  joinedAt: string
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch groups')
      }
      const data = await response.json()
      setGroups(data.groups || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('שגיאה בטעינת הקבוצות')
    } finally {
      setLoading(false)
    }
  }

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'EDITOR':
        return <Edit className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container max-w-4xl mx-auto p-6">
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
      <main className="container max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">הקבוצות שלי</h1>
          <p className="text-gray-600">
            כאן תוכל לראות את כל הקבוצות שאתה חבר בהן ולשתף את קוד הקבוצה עם אחרים
          </p>
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
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{group.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {getRoleIcon(group.role)}
                        <span>{getRoleLabel(group.role)}</span>
                        <span className="text-gray-400">•</span>
                        <span>
                          הצטרפת ב-
                          {new Date(group.joinedAt).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">קוד הקבוצה</p>
                        <code className="text-lg font-mono font-semibold text-primary">
                          {group.slug}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyGroupCode(group.slug, group.name)}
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        העתק קוד
                      </Button>
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

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => router.push('/onboarding')} className="gap-2">
            <Users className="h-4 w-4" />
            הצטרף לקבוצה נוספת
          </Button>
        </div>
      </main>
    </div>
  )
}
