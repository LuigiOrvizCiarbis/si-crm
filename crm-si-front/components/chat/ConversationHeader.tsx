import { Avatar, AvatarFallback } from "@radix-ui/react-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LeadScoreBadge } from "@/components/Badges"
import { ArrowLeft, Info, MoreVertical, History, ListTodo, Pencil, Check, X } from "lucide-react"
import { Conversation } from "@/data/types"
import { useEffect, useRef, useState } from "react"
import { ContactHistoryDrawer } from "./ContactHistoryDrawer"
import { NewTaskModal } from "@/components/tasks/NewTaskModal"
import { useAuthStore } from "@/store/useAuthStore"
import { useTranslation } from "@/hooks/useTranslation"

interface ConversationHeaderProps {
  conversation: Conversation
  isContactInfoOpen: boolean
  onBack: () => void
  onToggleContactInfo: () => void
  onRenameContact?: (name: string) => Promise<void> | void
}

export function ConversationHeader({
  conversation,
  isContactInfoOpen,
  onBack,
  onToggleContactInfo,
  onRenameContact,
}: ConversationHeaderProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(conversation.contact.name)
  const [isSavingName, setIsSavingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const currentUser = useAuthStore((state) => state.user)
  const { t } = useTranslation()
  const leadScore = conversation.leadScore ?? 0

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(conversation.contact.name)
    }
  }, [conversation.contact.name, isEditingName])

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [isEditingName])

  const startEditingName = () => {
    setNameDraft(conversation.contact.name)
    setIsEditingName(true)
  }

  const cancelEditingName = () => {
    setIsEditingName(false)
    setNameDraft(conversation.contact.name)
  }

  const saveName = async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed || trimmed === conversation.contact.name) {
      cancelEditingName()
      return
    }
    try {
      setIsSavingName(true)
      await onRenameContact?.(trimmed)
      setIsEditingName(false)
    } finally {
      setIsSavingName(false)
    }
  }

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      void saveName()
    } else if (event.key === "Escape") {
      event.preventDefault()
      cancelEditingName()
    }
  }

  const initials = conversation.contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  return (
    <div className="p-4 border-b border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={nameInputRef}
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    disabled={isSavingName}
                    maxLength={255}
                    className="h-7 w-48 text-sm font-medium"
                    aria-label={t("chats.editContactName")}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => void saveName()}
                    disabled={isSavingName}
                    title={t("chats.save")}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={cancelEditingName}
                    disabled={isSavingName}
                    title={t("chats.cancel")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group">
                  <h3 className="font-medium truncate">{conversation.contact.name}</h3>
                  {onRenameContact && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      onClick={startEditingName}
                      title={t("chats.editContactName")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
              <LeadScoreBadge
                score={leadScore}
                className="cursor-help"
                title={`${t("chats.leadScore")}: ${leadScore}/100 - ${t("chats.leadScoreHint")}`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {conversation.contact.phone || t("chats.online")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setTaskModalOpen(true)}
            title={t("chats.createTask")}
          >
            <ListTodo className="w-4 h-4" />
            {t("chats.createTask")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            title={t("chats.viewFullHistory")}
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleContactInfo}
            aria-pressed={isContactInfoOpen}
          >
            <Info className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ContactHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        contactId={conversation.contact.id}
        contactName={conversation.contact.name}
      />

      <NewTaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onCreateTask={() => {}}
        prefilledData={{
          relationType: "chat",
          relationId: String(conversation.id),
          relationLabel: conversation.contact.name,
          lockRelation: true,
          ...(currentUser ? { assigneeId: String(currentUser.id) } : {}),
        }}
      />
    </div>
  )
}
