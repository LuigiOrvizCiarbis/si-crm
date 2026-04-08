"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/hooks/useTranslation"
import { Paperclip, Smile, Send, X, Pencil, Check, Music2 } from "lucide-react"
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
  onSend: (content: string, media?: File) => void
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
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)

  const isEditing = !!editingMessage
  const isAudio = !!selectedMedia?.type.startsWith("audio/")
  const isImage = !!selectedMedia?.type.startsWith("image/")

  useEffect(() => {
    if (selectedMedia) {
      const url = URL.createObjectURL(selectedMedia)
      setMediaPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setMediaPreview(null)
  }, [selectedMedia])

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
    if (!value.trim() && !selectedMedia) return
    onSend(value.trim(), selectedMedia || undefined)
    setSelectedMedia(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert(t("chats.fileTooLarge") || "El archivo es demasiado grande (máx. 10MB)")
      return
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("audio/")) {
      alert(t("chats.onlyImagesOrAudio") || "Solo se permiten imágenes o audios")
      return
    }

    setSelectedMedia(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const canSend = isAudio ? selectedMedia : value.trim() || selectedMedia

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

      {mediaPreview && !isEditing && (
        <div className="px-4 pt-3 flex items-end gap-2">
          <div className="relative inline-block">
            {isImage ? (
              <Image
                src={mediaPreview}
                alt="Preview"
                width={120}
                height={120}
                className="rounded-lg object-cover max-h-[120px] w-auto"
              />
            ) : (
              <div className="min-w-[240px] max-w-[320px] rounded-lg border border-border bg-background p-3">
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <Music2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selectedMedia?.name}</span>
                </div>
                <audio controls src={mediaPreview} className="w-full" />
              </div>
            )}
            <button
              onClick={() => setSelectedMedia(null)}
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
                accept="image/*,audio/*"
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
            placeholder={
              isEditing
                ? t("chats.editingMessage")
                : isAudio
                  ? (t("chats.audioPlaceholder") || "Audio listo para enviar")
                  : (selectedMedia ? (t("chats.captionPlaceholder") || "Agregar caption...") : resolvedPlaceholder)
            }
            className="flex-1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={stopPropagation}
            onKeyPress={stopPropagation}
            disabled={disabled || isAudio}
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
