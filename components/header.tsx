'use client'

import { Bell, LogOut, User, Users } from 'lucide-react'
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

export function Header() {
  const { user, loading, signOut } = useAuth()

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
    <header className="bg-white dark:bg-gray-800 border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Logo + Navigation links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">FamilyNotify</h1>
            </Link>

            {/* Navigation links - only when logged in */}
            {!loading && user && (
              <nav className="flex items-center gap-2">
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
          <nav className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Button variant="default" asChild>
                      <Link href="/admin">ניהול</Link>
                    </Button>

                    <DropdownMenu>
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
                            <span className="text-xs text-gray-500 font-normal">{user.email}</span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/groups">
                            <Users className="ml-2 h-4 w-4" />
                            הקבוצות שלי
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/preferences">העדפות</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut}>
                          <LogOut className="ml-2 h-4 w-4" />
                          התנתק
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Button asChild>
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
  )
}
