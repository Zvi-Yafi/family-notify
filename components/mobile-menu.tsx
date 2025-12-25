'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  X,
  Bell,
  MessageSquare,
  Calendar,
  Users,
  Settings,
  LogOut,
  User as UserIcon,
  Crown,
  Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'
import Image from 'next/image'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(onClose, 300) // Wait for animation to finish
  }

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      handleClose()
    }

    router.events?.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events?.off('routeChangeStart', handleRouteChange)
    }
  }, [router])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen && !isAnimating) return null

  // Get user avatar from Google or default
  const getUserAvatar = () => {
    if (!user) return null
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.user_metadata?.avatar_url
    return avatarUrl
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return null
    const name =
      user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
    return name
  }

  const avatarUrl = getUserAvatar()
  const displayName = getUserDisplayName()

  const navigationItems = [
    { href: '/feed', label: 'הודעות', icon: MessageSquare },
    { href: '/events', label: 'אירועים', icon: Calendar },
    { href: '/groups', label: 'הקבוצות שלי', icon: Users },
    { href: '/admin', label: 'ניהול', icon: Crown },
    { href: '/preferences', label: 'העדפות', icon: Settings },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-in Menu - opens from RIGHT for RTL */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="תפריט ניווט"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">FamilyNotify</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="touch-target"
              aria-label="סגור תפריט"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* User Profile Section */}
          {user && (
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName || user.email || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">{displayName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = router.pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg touch-target transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-base">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer - Logout */}
          {user && (
            <div className="p-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 touch-target"
                onClick={() => {
                  signOut()
                  handleClose()
                }}
              >
                <LogOut className="h-5 w-5" />
                <span className="text-base">התנתק</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
