'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  const refreshGroups = useCallback(async () => {
    try {
      setLoadingGroups(true)
      const response = await fetch('/api/groups', {
        credentials: 'include',
      })

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

        try {
          const invResponse = await fetch('/api/invitations/pending', {
            credentials: 'include',
          })
          if (invResponse.ok) {
            const data = await invResponse.json()
            setPendingInvitations(data.invitations || [])
          }
        } catch (invError) {
          console.error('Failed to fetch pending invitations:', invError)
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
      setGroups([])
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGroupId = localStorage.getItem('familyGroupId')
      const storedUserId = localStorage.getItem('userId')

      if (storedGroupId) setFamilyGroupIdState(storedGroupId)
      if (storedUserId) setUserIdState(storedUserId)
    }
  }, [])

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.log('No active session:', error.message)
          setLoadingGroups(false)
          return
        }

        if (session) {
          await refreshGroups()
        } else {
          setGroups([])
          setPendingInvitations([])
          setLoadingGroups(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setLoadingGroups(false)
      }
    }

    checkAuthAndFetch()
  }, [refreshGroups])

  // Sync familyGroupId with storage and handle validation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (familyGroupId) {
        localStorage.setItem('familyGroupId', familyGroupId)
      } else {
        localStorage.removeItem('familyGroupId')
      }
    }

    // Auto-select logic if groups available but none selected
    if (groups.length > 0 && !familyGroupId) {
      // Only auto-select if exactly one group
      if (groups.length === 1) {
        setFamilyGroupIdState(groups[0].id)
      }
    } else if (groups.length > 0 && familyGroupId) {
      // Validate
      const isValid = groups.some((g) => g.id === familyGroupId)
      if (!isValid) {
        setFamilyGroupIdState(null)
      }
    } else if (groups.length === 0 && !loadingGroups && familyGroupId) {
      // No groups remaining for user - definitely clear
      setFamilyGroupIdState(null)
    }
  }, [familyGroupId, groups, loadingGroups])

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
