"use client"

import { useMemo } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ContactField } from "@/lib/api/contact-fields"

interface CustomFieldInputProps {
  field: ContactField
  value: unknown
  onChange: (next: unknown) => void
  disabled?: boolean
  className?: string
}

export function CustomFieldInput({ field, value, onChange, disabled, className }: CustomFieldInputProps) {
  const id = `cf-${field.key}`
  const choices = field.options?.choices ?? []

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)
  const handleNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    onChange(raw === "" ? null : Number(raw))
  }

  const labelNode = (
    <Label htmlFor={id} className="text-sm">
      {field.label}
      {field.is_required ? <span className="text-destructive ml-1">*</span> : null}
    </Label>
  )

  const inputNode = useMemo(() => {
    switch (field.type) {
      case "text":
        return (
          <Input
            id={id}
            type="text"
            value={(value as string | null | undefined) ?? ""}
            onChange={handleText}
            disabled={disabled}
          />
        )
      case "number":
        return (
          <Input
            id={id}
            type="number"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={handleNumber}
            disabled={disabled}
          />
        )
      case "date":
        return (
          <Input
            id={id}
            type="date"
            value={(value as string | null | undefined) ?? ""}
            onChange={handleText}
            disabled={disabled}
          />
        )
      case "boolean":
        return (
          <Switch
            id={id}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
            disabled={disabled}
          />
        )
      case "select":
        return (
          <Select
            value={(value as string | null | undefined) ?? ""}
            onValueChange={(next) => onChange(next === "__none__" ? null : next)}
            disabled={disabled}
          >
            <SelectTrigger id={id}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {choices.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {choice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "multi_select": {
        const selected = Array.isArray(value) ? (value as string[]) : []
        return (
          <div className="space-y-2">
            {choices.map((choice) => {
              const checked = selected.includes(choice)
              return (
                <div key={choice} className="flex items-center gap-2">
                  <Checkbox
                    id={`${id}-${choice}`}
                    checked={checked}
                    onCheckedChange={(next) => {
                      const value = Boolean(next)
                      const updated = value
                        ? Array.from(new Set([...selected, choice]))
                        : selected.filter((c) => c !== choice)
                      onChange(updated)
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${id}-${choice}`} className="text-sm font-normal">
                    {choice}
                  </Label>
                </div>
              )
            })}
          </div>
        )
      }
      case "email":
        return (
          <Input
            id={id}
            type="email"
            value={(value as string | null | undefined) ?? ""}
            onChange={handleText}
            disabled={disabled}
          />
        )
      case "url":
        return (
          <Input
            id={id}
            type="url"
            value={(value as string | null | undefined) ?? ""}
            onChange={handleText}
            disabled={disabled}
          />
        )
      case "phone":
        return (
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            value={(value as string | null | undefined) ?? ""}
            onChange={handleText}
            disabled={disabled}
          />
        )
      default:
        return null
    }
  }, [field.type, value, choices, disabled, id])

  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      {labelNode}
      {inputNode}
    </div>
  )
}
