'use client'

import { useState } from 'react'
import { useFamilyContext } from '@/lib/context/family-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Check, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [open, setOpen] = useState(false)

  const handleSelectGroup = (groupId: string) => {
    setFamilyGroup(groupId)
    onGroupSelected?.(groupId)
    setOpen(false)
  }

  if (loadingGroups) {
    return (
      <Card className="mb-4 sm:mb-6">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">טוען קבוצות...</p>
        </CardContent>
      </Card>
    )
  }

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
            קבוצה: <strong>{selectedGroup?.name}</strong>
          </span>
          {selectedGroup?.memberCount != null && (
            <span className="text-xs text-muted-foreground">
              ({selectedGroup.memberCount} חברים)
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-4 sm:mb-6">
      {showInvitations && <PendingInvitations />}

      <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 p-3 sm:p-4 transition-colors hover:bg-primary/10"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm text-foreground truncate">
              קבוצה: <strong>{selectedGroup?.name ?? title}</strong>
            </span>
            {selectedGroup?.memberCount != null && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                ({selectedGroup.memberCount} חברים)
              </span>
            )}
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </button>

        {open && (
          <div className="border-t border-primary/20 p-2 sm:p-3 flex flex-col gap-1.5">
            {groups.map((group) => {
              const isActive = familyGroupId === group.id
              return (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-md text-right transition-all touch-target ${
                    isActive
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-accent border border-transparent'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {group.name}
                    </p>
                    {group.memberCount != null && (
                      <p className="text-xs text-muted-foreground">
                        {group.memberCount} חברים
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
