import { Avatar, AvatarFallback } from "@radix-ui/react-avatar"
import { Button } from "@/components/ui/button"
import { LeadScoreBadge } from "@/components/Badges"
import { ArrowLeft, Info, MoreVertical, History } from "lucide-react"
import { Conversation } from "@/data/types"
import { useState } from "react"
import { ContactHistoryDrawer } from "./ContactHistoryDrawer"

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
                score={conversation.leadScore || 0}
                className="cursor-help"
                title={`Lead Score: ${conversation.leadScore}/100 - Basado en intención, recencia y canal`}
              />
            </div>
            <p className="text-xs text-muted-foreground">En línea</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            title="Ver historial completo"
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
    </div>
  )
}