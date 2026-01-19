'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/router'

interface ClientDashboardGateProps {
  isAuthedFromServer: boolean
}

export function ClientDashboardGate({ isAuthedFromServer }: ClientDashboardGateProps) {
  const router = useRouter()

  useEffect(() => {
    if (isAuthedFromServer) {
      router.replace('/feed')
    }
  }, [isAuthedFromServer, router])

  return null
}
