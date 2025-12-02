import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <CardTitle className="text-3xl">404</CardTitle>
          <CardDescription className="text-lg">
            הדף שחיפשת לא נמצא
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">
            נראה שהדף שניסית להגיע אליו לא קיים או הועבר למקום אחר.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/">
              <Button>חזרה לדף הבית</Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline">לפיד ההודעות</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

