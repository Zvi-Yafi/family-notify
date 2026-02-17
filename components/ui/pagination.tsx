import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="touch-target"
      >
        <ChevronRight className="h-4 w-4 ml-1" />
        הקודם
      </Button>
      <span className="text-sm text-muted-foreground min-w-[100px] text-center">
        עמוד {page} מתוך {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="touch-target"
      >
        הבא
        <ChevronLeft className="h-4 w-4 mr-1" />
      </Button>
    </div>
  )
}
