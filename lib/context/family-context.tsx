'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface Group {
  id: string
  name: string
  slug: string
  role: 'ADMIN' | 'EDITOR' | 'MEMBER'
  joinedAt?: string
}

interface FamilyContextType {
  familyGroupId: string | null
  userId: string | null
  groups: Group[]
  selectedGroup: Group | null
  loadingGroups: boolean
  pendingInvitations: any[]
  setFamilyGroup: (groupId: string | null) => void
  setUser: (userId: string | null) => void
  clearAll: () => void
  refreshGroups: () => Promise<void>
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [familyGroupId, setFamilyGroupIdState] = useState<string | null>(null)
  const [userId, setUserIdState] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  // Fetch user's groups
  const refreshGroups = useCallback(async () => {
    try {
      setLoadingGroups(true)
      const response = await fetch('/api/groups')

      // If not authenticated, just set empty groups and clear user
      if (response.status === 401) {
        setGroups([])
        setPendingInvitations([])
        setUserIdState(null)
        setFamilyGroupIdState(null)
        setLoadingGroups(false)
        return
      }

      if (response.ok) {
        const data = await response.json()
        const userGroups = data.groups || []
        setGroups(userGroups)

        // Validate currently selected group against fresh list
        if (familyGroupId) {
          const isValid = userGroups.some((g: Group) => g.id === familyGroupId)
          if (!isValid) {
            console.log('🧹 Clearing invalid familyGroupId from session/storage')
            setFamilyGroupIdState(null)
            if (typeof window !== 'undefined') {
              localStorage.removeItem('familyGroupId')
            }
          }
        }

        // Auto-select group if user has exactly one group and none selected
        if (userGroups.length === 1 && !familyGroupId) {
          const singleGroup = userGroups[0]
          setFamilyGroupIdState(singleGroup.id)
          if (typeof window !== 'undefined') {
            localStorage.setItem('familyGroupId', singleGroup.id)
          }
        } else if (userGroups.length === 0) {
          // No groups at all - definitely clear
          setFamilyGroupIdState(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('familyGroupId')
          }
        }
      }

      // Fetch pending invitations too
      try {
        const invResponse = await fetch('/api/invitations/pending')
        if (invResponse.ok) {
          const data = await invResponse.json()
          setPendingInvitations(data.invitations || [])
        }
      } catch (invError) {
        console.error('Failed to fetch pending invitations:', invError)
      }
    } catch (error) {
      // Network error or other issue - just log and set empty
      console.error('Failed to fetch groups:', error)
      setGroups([])
    } finally {
      setLoadingGroups(false)
    }
  }, [familyGroupId])

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

  const setFamilyGroup = (groupId: string | null) => {
    setFamilyGroupIdState(groupId)
    if (typeof window !== 'undefined') {
      if (groupId) localStorage.setItem('familyGroupId', groupId)
      else localStorage.removeItem('familyGroupId')
    }
  }

  const setUser = (uid: string | null) => {
    setUserIdState(uid)
    if (typeof window !== 'undefined') {
      if (uid) localStorage.setItem('userId', uid)
      else localStorage.removeItem('userId')
    }
  }

  const clearAll = useCallback(() => {
    setUserIdState(null)
    setFamilyGroupIdState(null)
    setGroups([])
    setPendingInvitations([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId')
      localStorage.removeItem('familyGroupId')
    }
  }, [])

  const selectedGroup = groups.find((g) => g.id === familyGroupId) || null

  return (
    <FamilyContext.Provider
      value={{
        familyGroupId,
        userId,
        groups,
        selectedGroup,
        loadingGroups,
        pendingInvitations,
        setFamilyGroup,
        setUser,
        clearAll,
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
