"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/hooks/useTranslation"
import { Paperclip, Smile, Send, X, Pencil, Check } from "lucide-react"
import { KeyboardEvent, SyntheticEvent, useRef, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Message } from "@/data/types"

const TemplatePicker = dynamic(
  () => import("./TemplatePicker").then(m => m.TemplatePicker),
  { ssr: false }
)

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (content: string, image?: File) => void
  disabled?: boolean
  placeholder?: string
  channelId?: number | null
  conversationId?: number | null
  onSendTemplate?: (content: string) => void
  editingMessage?: Message | null
  onCancelEdit?: () => void
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
  channelId,
  conversationId,
  onSendTemplate,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) {
  const { t } = useTranslation()
  const resolvedPlaceholder = placeholder ?? t("chats.messagePlaceholder")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const isEditing = !!editingMessage

  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setImagePreview(null)
  }, [selectedImage])

  useEffect(() => {
    if (editingMessage) {
      inputRef.current?.focus()
    }
  }, [editingMessage])

  const stopPropagation = (e: SyntheticEvent) => {
    e.stopPropagation()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "Escape" && isEditing && onCancelEdit) {
      e.preventDefault()
      onCancelEdit()
    }
  }

  const handleSend = () => {
    if (!value.trim() && !selectedImage) return
    onSend(value.trim(), selectedImage || undefined)
    setSelectedImage(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert(t("chats.fileTooLarge") || "El archivo es demasiado grande (máx. 10MB)")
      return
    }

    if (!file.type.startsWith("image/")) {
      alert(t("chats.onlyImages") || "Solo se permiten imágenes")
      return
    }

    setSelectedImage(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const canSend = value.trim() || selectedImage

  return (
    <div className="border-t border-border bg-card sticky bottom-0 md:relative">
      {/* Edit mode banner */}
      {isEditing && (
        <div className="px-4 pt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Pencil className="h-4 w-4 shrink-0" />
          <span className="truncate flex-1">
            {t("chats.editingMessage")}: {editingMessage.content}
          </span>
          <button
            onClick={onCancelEdit}
            className="shrink-0 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {imagePreview && !isEditing && (
        <div className="px-4 pt-3 flex items-end gap-2">
          <div className="relative inline-block">
            <Image
              src={imagePreview}
              alt="Preview"
              width={120}
              height={120}
              className="rounded-lg object-cover max-h-[120px] w-auto"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              {channelId && conversationId && onSendTemplate && (
                <TemplatePicker
                  channelId={channelId}
                  conversationId={conversationId}
                  onSend={onSendTemplate}
                  disabled={disabled}
                />
              )}
            </>
          )}
          <Input
            ref={inputRef}
            placeholder={isEditing ? t("chats.editingMessage") : (selectedImage ? (t("chats.captionPlaceholder") || "Agregar caption...") : resolvedPlaceholder)}
            className="flex-1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={stopPropagation}
            onKeyPress={stopPropagation}
            disabled={disabled}
          />
          {!isEditing && (
            <Button variant="ghost" size="sm" disabled={disabled}>
              <Smile className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" onClick={handleSend} disabled={disabled || !canSend}>
            {isEditing ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
