import { Avatar, AvatarFallback } from "@radix-ui/react-avatar"
import { Button } from "@/components/ui/button"
import { LeadScoreBadge } from "@/components/Badges"
import { ArrowLeft, Info, MoreVertical, History, ListTodo } from "lucide-react"
import { Conversation } from "@/data/types"
import { useState } from "react"
import { ContactHistoryDrawer } from "./ContactHistoryDrawer"
import { NewTaskModal } from "@/components/tasks/NewTaskModal"
import { useAuthStore } from "@/store/useAuthStore"
import { useTranslation } from "@/hooks/useTranslation"

interface ConversationHeaderProps {
  conversation: Conversation
  isContactInfoOpen: boolean
  onBack: () => void
  onToggleContactInfo: () => void
}

export function ConversationHeader({
  conversation,
  isContactInfoOpen,
  onBack,
  onToggleContactInfo,
}: ConversationHeaderProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const currentUser = useAuthStore((state) => state.user)
  const { t } = useTranslation()
  const leadScore = conversation.leadScore ?? 0

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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{conversation.contact.name}</h3>
              <LeadScoreBadge
                score={leadScore}
                className="cursor-help"
                title={`${t("chats.leadScore")}: ${leadScore}/100 - ${t("chats.leadScoreHint")}`}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("chats.online")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTaskModalOpen(true)}
            title={t("chats.createTask")}
          >
            <ListTodo className="w-4 h-4" />
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
