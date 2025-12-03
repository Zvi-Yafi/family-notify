'use client'

import { useFamilyContext } from '@/lib/context/family-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Check } from 'lucide-react'
import Link from 'next/link'

interface GroupSelectorProps {
  onGroupSelected?: (groupId: string) => void
  title?: string
  description?: string
}

export function GroupSelector({
  onGroupSelected,
  title = 'בחר קבוצה',
  description = 'בחר את הקבוצה שאליה תרצה לשלוח',
}: GroupSelectorProps) {
  const { groups, familyGroupId, setFamilyGroup, loadingGroups, selectedGroup } = useFamilyContext()

  const handleSelectGroup = (groupId: string) => {
    setFamilyGroup(groupId)
    onGroupSelected?.(groupId)
  }

  if (loadingGroups) {
    return (
      <Card>
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
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">אין לך קבוצות עדיין</h3>
          <p className="text-gray-600 mb-4">צור קבוצה חדשה או הצטרף לקבוצה קיימת כדי להתחיל</p>
          <Button asChild>
            <Link href="/onboarding">הצטרף לקבוצה</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // One group - already auto-selected, show current selection
  if (groups.length === 1 && familyGroupId) {
    return (
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-blue-800 dark:text-blue-200">
            שולח ל: <strong>{selectedGroup?.name}</strong>
          </span>
        </div>
      </div>
    )
  }

  // Multiple groups - show selector
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group.id)}
              className={`w-full p-4 rounded-lg border-2 text-right transition-all ${
                familyGroupId === group.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users
                    className={`h-5 w-5 ${
                      familyGroupId === group.id ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-gray-500">קוד: {group.slug}</p>
                  </div>
                </div>
                {familyGroupId === group.id && <Check className="h-5 w-5 text-blue-600" />}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
