'use client'

import { useState } from 'react'
import { useFamilyContext } from '@/lib/context/family-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, UserPlus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export function PendingInvitations() {
  const { pendingInvitations, refreshGroups } = useFamilyContext()
  const { toast } = useToast()
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null)

  const handleAcceptInvite = async (token: string, groupName: string) => {
    try {
      setAcceptingToken(token)
      await apiClient.acceptInvitation(token)
      toast({
        title: 'ברוכים הבאים!',
        description: `הצטרפת בהצלחה לקבוצת ${groupName}`,
      })
      await refreshGroups()
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'נכשל בהצטרפות לקבוצה',
        variant: 'destructive',
      })
    } finally {
      setAcceptingToken(null)
    }
  }

  if (!pendingInvitations || pendingInvitations.length === 0) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800 mb-4 sm:mb-6">
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm font-bold text-blue-800 dark:text-blue-300">
            הזמנות ממתינות לך
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
        <div className="space-y-3">
          {pendingInvitations.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800/50 gap-3 shadow-sm"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold">{inv.familyGroup.name}</p>
                <p className="text-xs text-gray-500">
                  הוזמנת ע&quot;י {inv.inviter?.name || 'משתמש'}
                </p>
              </div>
              <Button
                size="sm"
                className="w-full sm:w-auto text-xs"
                onClick={() => handleAcceptInvite(inv.token, inv.familyGroup.name)}
                disabled={!!acceptingToken}
              >
                {acceptingToken === inv.token ? (
                  <Loader2 className="h-3 w-3 animate-spin ml-2" />
                ) : (
                  <UserPlus className="h-3 w-3 ml-2" />
                )}
                אני רוצה להצטרף
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
