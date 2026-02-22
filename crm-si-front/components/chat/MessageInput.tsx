"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/hooks/useTranslation"
import { Paperclip, Smile, Send } from "lucide-react"
import { KeyboardEvent, SyntheticEvent } from "react"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
}: MessageInputProps) {
  const { t } = useTranslation()
  const resolvedPlaceholder = placeholder ?? t("chats.messagePlaceholder")
  
  // Función auxiliar para detener propagación en cualquier evento
  const stopPropagation = (e: SyntheticEvent) => {
    e.stopPropagation()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Detenemos la propagación para que no se disparen atajos globales
    e.stopPropagation()

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="p-4 border-t border-border bg-card sticky bottom-0 md:relative">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled={disabled}>
          <Paperclip className="w-4 h-4" />
        </Button>
        <Input
          placeholder={resolvedPlaceholder}
          className="flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={stopPropagation}    // FIX: Bloquear también al soltar tecla
          onKeyPress={stopPropagation} // FIX: Bloquear también al presionar tecla
          disabled={disabled}
        />
        <Button variant="ghost" size="sm" disabled={disabled}>
          <Smile className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={onSend} disabled={disabled || !value.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
