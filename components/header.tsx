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

export function Header() {
  const { user, loading, signOut } = useAuth()

  return (
    <header className="bg-white dark:bg-gray-800 border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">FamilyNotify</h1>
          </Link>

          <nav className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/feed">הודעות</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href="/events">אירועים</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href="/groups">הקבוצות שלי</Link>
                    </Button>
                    <Button variant="default" asChild>
                      <Link href="/admin">ניהול</Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <User className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          {user.email}
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
                    <Button variant="ghost" asChild>
                      <Link href="/login">התחברות</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/onboarding">הרשמה</Link>
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


