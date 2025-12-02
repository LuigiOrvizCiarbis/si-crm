"use client"

import type React from "react"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type CellType = "text" | "textarea" | "select" | "phone" | "score" | "date"

interface EditableCellProps {
  value: string | number
  type: CellType
  options?: string[]
  onSave: (value: string | number) => void
  onCancel?: () => void
  isEditing: boolean
  onEditStart: () => void
  onNavigate?: (direction: "up" | "down" | "left" | "right") => void
  validation?: (value: string | number) => string | null
  className?: string
  renderDisplay?: (value: string | number) => React.ReactNode
}

export function EditableCell({
  value,
  type,
  options = [],
  onSave,
  onCancel,
  isEditing,
  onEditStart,
  onNavigate,
  validation,
  className = "",
  renderDisplay,
}: EditableCellProps) {
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
    setError(null)
  }, [value, isEditing])

  useEffect(() => {
    if (isEditing) {
      if (type === "textarea") {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      } else if (type !== "select" && type !== "date") {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
  }, [isEditing, type])

  const handleSave = () => {
    if (validation) {
      const validationError = validation(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }
    onSave(editValue)
    setError(null)
  }

  const handleCancel = () => {
    setEditValue(value)
    setError(null)
    onCancel?.()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    } else if (e.key === "Tab") {
      e.preventDefault()
      handleSave()
      onNavigate?.(e.shiftKey ? "left" : "right")
    } else if (e.key === "ArrowUp" && type !== "textarea") {
      e.preventDefault()
      handleSave()
      onNavigate?.("up")
    } else if (e.key === "ArrowDown" && type !== "textarea") {
      e.preventDefault()
      handleSave()
      onNavigate?.("down")
    } else if (e.key === "F2") {
      e.preventDefault()
      if (!isEditing) {
        onEditStart()
      }
    }
  }

  const formatPhoneInput = (input: string) => {
    const numbers = input.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 4) return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`
    if (numbers.length <= 7) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 3)} ${numbers.slice(3)}`
    if (numbers.length <= 10)
      return `+${numbers.slice(0, 2)} ${numbers.slice(2, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`
    return `+${numbers.slice(0, 2)} ${numbers.slice(2, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}-${numbers.slice(10, 14)}`
  }

  if (!isEditing) {
    return (
      <div
        className={`cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center ${className}`}
        onClick={onEditStart}
        onDoubleClick={onEditStart}
      >
        {renderDisplay ? renderDisplay(value) : <span>{value}</span>}
      </div>
    )
  }

  if (type === "textarea") {
    return (
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`min-h-[80px] max-h-[112px] resize-none ${error ? "border-red-500" : ""}`}
          rows={3}
        />
        {error && <span className="text-xs text-red-500 absolute -bottom-5 left-0">{error}</span>}
      </div>
    )
  }

  if (type === "select") {
    return (
      <Select
        value={editValue as string}
        onValueChange={(val) => {
          setEditValue(val)
          onSave(val)
        }}
      >
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (type === "date") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {editValue ? format(new Date(editValue as string), "PPP", { locale: es }) : "Seleccionar fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={editValue ? new Date(editValue as string) : undefined}
            onSelect={(date) => {
              if (date) {
                const formatted = format(date, "yyyy-MM-dd")
                setEditValue(formatted)
                onSave(formatted)
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  if (type === "phone") {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={editValue as string}
          onChange={(e) => setEditValue(formatPhoneInput(e.target.value))}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`font-mono ${error ? "border-red-500" : ""}`}
          placeholder="+54 9 XXX XXXX-XXXX"
        />
        {error && <span className="text-xs text-red-500 absolute -bottom-5 left-0">{error}</span>}
      </div>
    )
  }

  if (type === "score") {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          type="number"
          min={0}
          max={100}
          value={editValue as number}
          onChange={(e) => setEditValue(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`tabular-nums ${error ? "border-red-500" : ""}`}
        />
        {error && <span className="text-xs text-red-500 absolute -bottom-5 left-0">{error}</span>}
      </div>
    )
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={editValue as string}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={error ? "border-red-500" : ""}
      />
      {error && <span className="text-xs text-red-500 absolute -bottom-5 left-0">{error}</span>}
    </div>
  )
}
