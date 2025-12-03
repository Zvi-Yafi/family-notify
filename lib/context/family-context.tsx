'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface Group {
  id: string
  name: string
  slug: string
  role: 'ADMIN' | 'EDITOR' | 'MEMBER'
}

interface FamilyContextType {
  familyGroupId: string | null
  userId: string | null
  groups: Group[]
  selectedGroup: Group | null
  loadingGroups: boolean
  setFamilyGroup: (groupId: string) => void
  setUser: (userId: string) => void
  refreshGroups: () => Promise<void>
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [familyGroupId, setFamilyGroupIdState] = useState<string | null>(null)
  const [userId, setUserIdState] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  // Fetch user's groups
  const refreshGroups = useCallback(async () => {
    try {
      setLoadingGroups(true)
      const response = await fetch('/api/groups')

      // If not authenticated, just set empty groups
      if (response.status === 401) {
        setGroups([])
        setLoadingGroups(false)
        return
      }

      if (response.ok) {
        const data = await response.json()
        const userGroups = data.groups || []
        setGroups(userGroups)

        // Auto-select group if user has exactly one group
        if (userGroups.length === 1) {
          const singleGroup = userGroups[0]
          setFamilyGroupIdState(singleGroup.id)
          if (typeof window !== 'undefined') {
            localStorage.setItem('familyGroupId', singleGroup.id)
          }
        } else if (userGroups.length > 1) {
          // Check if previously selected group is still valid
          const storedGroupId = localStorage.getItem('familyGroupId')
          if (storedGroupId && userGroups.some((g: Group) => g.id === storedGroupId)) {
            setFamilyGroupIdState(storedGroupId)
          } else {
            // Clear invalid selection
            setFamilyGroupIdState(null)
            localStorage.removeItem('familyGroupId')
          }
        }
      }
    } catch (error) {
      // Network error or other issue - just log and set empty
      console.error('Failed to fetch groups:', error)
      setGroups([])
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  // Load from localStorage on mount, then fetch groups
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGroupId = localStorage.getItem('familyGroupId')
      const storedUserId = localStorage.getItem('userId')

      if (storedGroupId) setFamilyGroupIdState(storedGroupId)
      if (storedUserId) setUserIdState(storedUserId)
    }

    // Fetch groups after initial load
    refreshGroups()
  }, [refreshGroups])

  const setFamilyGroup = (groupId: string) => {
    setFamilyGroupIdState(groupId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('familyGroupId', groupId)
    }
  }

  const setUser = (uid: string) => {
    setUserIdState(uid)
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', uid)
    }
  }

  const selectedGroup = groups.find((g) => g.id === familyGroupId) || null

  return (
    <FamilyContext.Provider
      value={{
        familyGroupId,
        userId,
        groups,
        selectedGroup,
        loadingGroups,
        setFamilyGroup,
        setUser,
        refreshGroups,
      }}
    >
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamilyContext() {
  const context = useContext(FamilyContext)
  if (context === undefined) {
    throw new Error('useFamilyContext must be used within a FamilyProvider')
  }
  return context
}
