import * as React from 'react'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface StrictDateTimePickerProps {
  value: string // ISO string (YYYY-MM-DDTHH:mm)
  onChange: (value: string) => void
  label?: string
  id?: string
  required?: boolean
  className?: string
  helperText?: string
}

export function StrictDateTimePicker({
  value,
  onChange,
  label,
  id,
  required = false,
  className,
  helperText,
}: StrictDateTimePickerProps) {
  // Parse initial value
  const dateObj = value ? new Date(value) : undefined

  // State to manage parts
  const [datePart, setDatePart] = React.useState<string>(
    dateObj && !isNaN(dateObj.getTime()) ? value.split('T')[0] : ''
  )
  const [hourPart, setHourPart] = React.useState<string>(
    dateObj && !isNaN(dateObj.getTime()) ? String(dateObj.getHours()).padStart(2, '0') : '18'
  )
  const [minutePart, setMinutePart] = React.useState<string>(
    dateObj && !isNaN(dateObj.getTime()) ? String(dateObj.getMinutes()).padStart(2, '0') : '00'
  )

  // Sync internal state if external value changes (and is valid)
  React.useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setDatePart(value.split('T')[0])
        setHourPart(String(d.getHours()).padStart(2, '0'))

        // Round minute to nearest 10 for display if external value wasn't already rounded
        const m = d.getMinutes()
        const roundedM = Math.round(m / 10) * 10
        const displayM = roundedM === 60 ? '00' : String(roundedM).padStart(2, '0')
        // Note: we don't handle hour carry-over for 60 here strictly for display merely to pick a valid option

        setMinutePart(displayM)
      }
    } else {
      setDatePart('')
    }
  }, [value])

  // Reconstruct ISO string when any part changes
  const updateValue = (newDate: string, newHour: string, newMinute: string) => {
    if (!newDate) {
      onChange('')
      return
    }
    // simple string construction YYYY-MM-DDTHH:mm
    const iso = `${newDate}T${newHour}:${newMinute}`
    onChange(iso)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value
    setDatePart(newVal)
    updateValue(newVal, hourPart, minutePart)
  }

  const handleHourChange = (val: string) => {
    setHourPart(val)
    if (datePart) {
      updateValue(datePart, val, minutePart)
    }
  }

  const handleMinuteChange = (val: string) => {
    setMinutePart(val)
    if (datePart) {
      updateValue(datePart, hourPart, val)
    }
  }

  // Generate options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = ['00', '10', '20', '30', '40', '50']

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex flex-wrap gap-2">
        {/* Date Picker */}
        <div className="flex-1 min-w-[150px]">
          <Input
            id={id}
            type="date"
            value={datePart}
            onChange={handleDateChange}
            required={required}
            className="w-full"
          />
        </div>

        {/* Time Pickers */}
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Minute */}
          <Select value={minutePart} onValueChange={handleMinuteChange} disabled={!datePart}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="דקה" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="self-center font-bold text-gray-400">:</span>

          {/* Hour */}
          <Select value={hourPart} onValueChange={handleHourChange} disabled={!datePart}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="שעה" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}
