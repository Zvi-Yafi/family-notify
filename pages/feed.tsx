import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { apiClient, UnauthorizedError } from '@/lib/api-client'
import { useFamilyContext } from '@/lib/context/family-context'
import { Header } from '@/components/header'
import { GroupSelector } from '@/components/group-selector'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  body: string
  type: 'GENERAL' | 'SIMCHA'
  createdAt: Date
  publishedAt: Date | null
  creator: { email: string; name?: string | null }
}

type TypeFilter = 'ALL' | 'GENERAL' | 'SIMCHA'

const ITEMS_PER_PAGE = 10

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'הכל' },
  { value: 'GENERAL', label: 'כללי' },
  { value: 'SIMCHA', label: 'שמחה' },
]

function CardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="h-6 w-48 rounded bg-muted mb-2" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="h-6 w-16 rounded-full bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function FeedPage() {
  const { familyGroupId, groups, loadingGroups } = useFamilyContext()
  const { toast } = useToast()
  const listRef = useRef<HTMLDivElement>(null)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnnouncements = useCallback(
    async (pageNum: number, type: TypeFilter) => {
      if (!familyGroupId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await apiClient.getAnnouncementsPaginated(familyGroupId, {
          page: pageNum,
          limit: ITEMS_PER_PAGE,
          type: type !== 'ALL' ? type : undefined,
        })

        setAnnouncements(
          data.items.map((a: any) => ({
            ...a,
            createdAt: new Date(a.createdAt),
            publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
          }))
        )
        setTotalPages(data.totalPages)
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          return
        }
        console.error('Failed to load announcements:', err)
        const message = err instanceof Error ? err.message : 'שגיאה בטעינת ההודעות'
        setError(message)
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לטעון את ההודעות. אנא נסה שוב.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [familyGroupId, toast]
  )

  useEffect(() => {
    loadAnnouncements(page, typeFilter)
  }, [page, typeFilter, loadAnnouncements])

  useEffect(() => {
    setPage(1)
    setTypeFilter('ALL')
    setAnnouncements([])
  }, [familyGroupId])

  const handleTypeChange = (type: TypeFilter) => {
    setTypeFilter(type)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    listRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRetry = () => {
    loadAnnouncements(page, typeFilter)
  }

  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto text-primary mb-4 animate-spin" />
            <p className="text-muted-foreground">טוען קבוצות...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">פיד הודעות</h2>
              <p className="text-sm text-muted-foreground">
                כל ההודעות והשמחות האחרונות מהמשפחה
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {familyGroupId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={loading}
                    className="touch-target"
                  >
                    <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                    רענן
                  </Button>
                  <Button asChild className="touch-target">
                    <Link href="/admin?tab=announcements">הוסף הודעה</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {(groups.length === 0 || groups.length > 1) && (
            <GroupSelector
              title={familyGroupId ? 'החלף קבוצה' : 'בחר קבוצה לצפייה בהודעות'}
              description="בחר את הקבוצה שתרצה לראות את ההודעות שלה"
            />
          )}

          {familyGroupId && (
            <>
              <div className="mb-4 flex gap-1 p-1 bg-muted rounded-lg w-fit">
                {TYPE_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleTypeChange(tab.value)}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[36px]',
                      typeFilter === tab.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div ref={listRef}>
                {loading && (
                  <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                )}

                {!loading && error && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
                      <Button onClick={handleRetry} className="touch-target">
                        נסה שוב
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {!loading && !error && announcements.length > 0 && (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                            <div className="flex-1 min-w-0 w-full">
                              <CardTitle className="text-lg sm:text-xl mb-2">
                                {announcement.title}
                              </CardTitle>
                              <CardDescription className="text-xs sm:text-sm">
                                פורסם על ידי{' '}
                                {announcement.creator.name || announcement.creator.email} •{' '}
                                {announcement.createdAt.toLocaleDateString('he-IL')}
                              </CardDescription>
                            </div>
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 self-start sm:self-auto',
                                announcement.type === 'SIMCHA'
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-primary/10 text-primary'
                              )}
                            >
                              {announcement.type === 'SIMCHA' ? 'שמחה' : 'כללי'}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                          <p className="text-sm sm:text-base text-foreground/80 whitespace-pre-wrap">
                            {announcement.body}
                          </p>
                        </CardContent>
                      </Card>
                    ))}

                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      className="mt-6"
                    />
                  </div>
                )}

                {!loading && !error && announcements.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        {typeFilter !== 'ALL'
                          ? `אין הודעות מסוג ${typeFilter === 'SIMCHA' ? 'שמחה' : 'כללי'}`
                          : 'אין הודעות חדשות'}
                      </p>
                      {typeFilter !== 'ALL' ? (
                        <Button
                          variant="outline"
                          onClick={() => handleTypeChange('ALL')}
                          className="touch-target"
                        >
                          הצג את כל ההודעות
                        </Button>
                      ) : (
                        <Button asChild className="touch-target">
                          <Link href="/admin?tab=announcements">פרסם הודעה ראשונה</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
