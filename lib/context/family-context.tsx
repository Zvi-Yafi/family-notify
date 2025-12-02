'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface FamilyContextType {
  familyGroupId: string | null
  userId: string | null
  setFamilyGroup: (groupId: string) => void
  setUser: (userId: string) => void
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [familyGroupId, setFamilyGroupIdState] = useState<string | null>(null)
  const [userId, setUserIdState] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGroupId = localStorage.getItem('familyGroupId')
      const storedUserId = localStorage.getItem('userId')
      
      if (storedGroupId) setFamilyGroupIdState(storedGroupId)
      if (storedUserId) setUserIdState(storedUserId)
    }
  }, [])

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

  return (
    <FamilyContext.Provider 
      value={{ 
        familyGroupId, 
        userId, 
        setFamilyGroup, 
        setUser 
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


