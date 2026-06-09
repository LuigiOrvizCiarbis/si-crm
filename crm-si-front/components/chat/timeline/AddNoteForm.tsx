"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createNote } from "@/lib/api/notes"
import { useTranslation } from "@/hooks/useTranslation"

interface AddNoteFormProps {
  contactId?: number
  conversationId?: number
  onCreated: () => void
}

export function AddNoteForm({ contactId, conversationId, onCreated }: AddNoteFormProps) {
  const { t } = useTranslation()
  const [body, setBody] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const trimmed = body.trim()
    if (!trimmed) return

    try {
      setIsSaving(true)
      setError(null)
      await createNote({
        body: trimmed,
        contact_id: contactId ?? null,
        conversation_id: conversationId ?? null,
      })
      setBody("")
      onCreated()
    } catch {
      setError(t("timeline.noteError"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("timeline.notePlaceholder")}
        rows={3}
        maxLength={5000}
        disabled={isSaving}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={isSaving || !body.trim()}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t("timeline.saveNote")}
        </Button>
      </div>
    </div>
  )
}
