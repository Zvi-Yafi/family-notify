'use client'

import { FamilyProvider } from '@/lib/context/family-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return <FamilyProvider>{children}</FamilyProvider>
}


