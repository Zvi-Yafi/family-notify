'use client'

import { useState } from 'react'
import { Bell, LogOut, User, Users, Menu, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Image from 'next/image'
import { MobileMenu } from '@/components/mobile-menu'
import { Logo } from '@/components/logo'

export function Header() {
  const { user, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get user avatar from Google or default
  const getUserAvatar = () => {
    if (!user) return null

    // Try to get avatar from Google (user_metadata)
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.user_metadata?.avatar_url

    return avatarUrl
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return null

    // Try to get name from user_metadata (Google or signup)
    const name =
      user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]

    return name
  }

  const avatarUrl = getUserAvatar()
  const displayName = getUserDisplayName()

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side: Logo + Navigation links */}
            <div className="flex items-center gap-6">
              {/* Mobile Menu Button - Only show on mobile when logged in */}
              {!loading && user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden touch-target"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="פתח תפריט"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              )}

              <Link href="/" className="flex items-center gap-2 group">
                <Logo className="h-8 w-8 p-1.5" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">FamilyNotify</h1>
              </Link>

              {/* Desktop Navigation links - hidden on mobile */}
              {!loading && user && (
                <nav className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href="/feed">הודעות</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/events">אירועים</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/groups">הקבוצות שלי</Link>
                  </Button>
                </nav>
              )}
            </div>

            {/* Right side: Admin + Profile */}
            <nav className="flex items-center gap-2 sm:gap-4">
              {!loading && (
                <>
                  {user ? (
                    <>
                      {/* Admin Button - hidden on mobile, shown in menu instead */}
                      <Button variant="default" asChild className="hidden md:inline-flex">
                        <Link href="/admin">ניהול</Link>
                      </Button>

                      {/* Desktop Dropdown Menu - hidden on mobile */}
                      <div className="hidden md:block">
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-full overflow-hidden p-0"
                            >
                              {avatarUrl ? (
                                <Image
                                  src={avatarUrl}
                                  alt={user.email || 'User'}
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  {avatarUrl && (
                                    <Image
                                      src={avatarUrl}
                                      alt={displayName || user.email || 'User'}
                                      width={24}
                                      height={24}
                                      className="rounded-full object-cover"
                                    />
                                  )}
                                  <span className="font-semibold">{displayName}</span>
                                </div>
                                <span className="text-xs text-gray-500 font-normal">
                                  {user.email}
                                </span>
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="gap-2">
                              <Link href="/profile">
                                <User className="ms-2 h-4 w-4" />
                                הפרופיל שלי
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="gap-2">
                              <Link href="/groups">
                                <Users className="ms-2 h-4 w-4" />
                                הקבוצות שלי
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="gap-2">
                              <Link href="/preferences">
                                <Settings className="ms-2 h-4 w-4" />
                                העדפות
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="gap-2">
                              <LogOut className="ms-2 h-4 w-4" />
                              התנתק
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Mobile Profile Icon - only avatar, opens mobile menu */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden rounded-full overflow-hidden p-0 touch-target"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="פתח תפריט משתמש"
                      >
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={user.email || 'User'}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild className="text-sm sm:text-base">
                        <Link href="/login">התחבר / הירשם</Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
