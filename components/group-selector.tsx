'use client'

import { useState } from 'react'
import { useFamilyContext } from '@/lib/context/family-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Check } from 'lucide-react'
import Link from 'next/link'
import { PendingInvitations } from './pending-invitations'

interface GroupSelectorProps {
  onGroupSelected?: (groupId: string) => void
  title?: string
  description?: string
  showInvitations?: boolean
}

export function GroupSelector({
  onGroupSelected,
  title = 'בחר קבוצה',
  description = 'בחר את הקבוצה שאליה תרצה לשלוח',
  showInvitations = false,
}: GroupSelectorProps) {
  const { groups, familyGroupId, setFamilyGroup, loadingGroups, selectedGroup } = useFamilyContext()

  const handleSelectGroup = (groupId: string) => {
    setFamilyGroup(groupId)
    onGroupSelected?.(groupId)
  }

  if (loadingGroups) {
    return (
      <Card className="mb-4 sm:mb-6">
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">טוען קבוצות...</p>
        </CardContent>
      </Card>
    )
  }

  // No groups - show join prompt
  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">אין לך קבוצות עדיין</h3>
          <p className="text-muted-foreground mb-4">צור קבוצה חדשה או הצטרף לקבוצה קיימת כדי להתחיל</p>
          <Button asChild>
            <Link href="/onboarding">הצטרף לקבוצה</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (groups.length === 1 && familyGroupId) {
    return (
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm text-foreground truncate">
            שולח ל: <strong>{selectedGroup?.name}</strong>
          </span>
        </div>
      </div>
    )
  }

  // Multiple groups or manual request - show selector
  return (
    <div className="space-y-4 mb-4 sm:mb-6">
      {showInvitations && <PendingInvitations />}

      {groups.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-col gap-2">
              {groups.map((group) => {
                const isActive = familyGroupId === group.id
                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group.id)}
                    className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 text-right transition-all touch-target ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:bg-accent'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {group.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {group.slug}
                      </p>
                    </div>
                    {isActive && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
