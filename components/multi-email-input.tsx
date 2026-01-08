'use client'

import { useState, KeyboardEvent } from 'react'
import { X, Plus, Mail, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MultiEmailInputProps {
  emails: string[]
  onChange: (emails: string[]) => void
  placeholder?: string
}

export function MultiEmailInput({
  emails,
  onChange,
  placeholder = 'הזן כתובת אימייל...',
}: MultiEmailInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
  }

  const addEmail = () => {
    const trimmedValue = inputValue.trim()
    if (!trimmedValue) return

    if (!validateEmail(trimmedValue)) {
      setError('פורמט אימייל לא תקין')
      return
    }

    if (emails.includes(trimmedValue)) {
      setError('אימייל זה כבר נוסף לרשימה')
      return
    }

    onChange([...emails, trimmedValue])
    setInputValue('')
    setError(null)
  }

  const removeEmail = (emailToRemove: string) => {
    onChange(emails.filter((email) => email !== emailToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail()
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addEmail()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="email"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={handleKeyDown}
            className={`pl-10 text-right ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            dir="ltr"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Button
          type="button"
          onClick={addEmail}
          size="icon"
          className="bg-blue-600 hover:bg-blue-700 h-10 w-10 shrink-0"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {emails.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className="pl-1 pr-3 py-1.5 flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors rounded-full"
            dir="ltr"
          >
            <span className="text-sm font-medium">{email}</span>
            <button
              type="button"
              onClick={() => removeEmail(email)}
              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {emails.length === 0 && !error && (
          <p className="text-sm text-gray-500 italic py-2">לא נוספו מיילים עדיין</p>
        )}
      </div>
    </div>
  )
}
