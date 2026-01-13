'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  iconClassName?: string
  variant?: 'blue' | 'white' | 'ghost'
}

export function Logo({ className, iconClassName, variant = 'blue' }: LogoProps) {
  const variants = {
    blue: 'bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 p-2',
    white: 'bg-white rounded-xl shadow-lg p-2',
    ghost: 'p-0',
  }

  const iconColors = {
    blue: 'text-white',
    white: 'text-blue-600',
    ghost: 'text-blue-600',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center transition-transform hover:rotate-6',
        variants[variant],
        className
      )}
    >
      <Bell className={cn('h-6 w-6', iconColors[variant], iconClassName)} />
    </div>
  )
}
