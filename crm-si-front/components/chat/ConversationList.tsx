import { memo, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { LeadScoreBadge } from "@/components/Badges"
import { PlatformIcon } from "@/components/chat/PlatformIcon"
import { EmptyState } from "@/components/EmptyState"
import { SkeletonList } from "@/components/Skeleton"
import { MessageSquare } from "lucide-react"
import { Conversation, Channel } from "@/data/types"
import { channelTypeToFilterType } from "@/data/enums"
import { useTranslation } from "@/hooks/useTranslation"
import { TagChips } from "@/components/tags/TagChips"
import { formatPhoneNumber } from "@/lib/utils/channelHelpers"

interface ConversationCardProps {
  conversation: Conversation
  channel?: Channel
  isSelected: boolean
  onClick: (id: number) => void
  selectionMode?: boolean
  isChecked?: boolean
  onToggleSelect?: (id: number) => void
}

const ConversationCard = memo(function ConversationCard({
  conversation,
  channel,
  isSelected,
  onClick,
  selectionMode = false,
  isChecked = false,
  onToggleSelect,
}: ConversationCardProps) {
  const { t } = useTranslation()

  const contactName = conversation.contact?.name || t("chats.unnamedContact")
  const contactPhone = formatPhoneNumber(conversation.contact?.phone)
  const leadScore = conversation.leadScore ?? null

  const formatLastMessageAt = (iso?: string | null) => {
    if (!iso) return "--:--"
    const date = new Date(iso)
    const now = new Date()
    const isSameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()

    if (isSameDay) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()

    if (isYesterday) return t("chats.yesterday")

    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    }

    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" })
  }

  const initials = contactName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelect?.(conversation.id)
    } else {
      onClick(conversation.id)
    }
  }

  return (
    <Card
      className={`p-3 cursor-pointer hover:bg-accent transition-colors ${isSelected ? 'bg-accent border-primary' : ''} ${isChecked ? 'bg-primary/5 border-primary/40' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3">
        {selectionMode && (
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => onToggleSelect?.(conversation.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Seleccionar conversación"
          />
        )}
        <div className="flex items-center gap-2">
          {channel && (
            <PlatformIcon
              type={channelTypeToFilterType(channel.type)}
              className="w-4 h-4"
            />
          )}
          <Avatar className="w-8 h-8 bg-muted">
            <AvatarFallback className="text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium text-sm truncate min-w-0">
                {contactName}
              </span>
              {leadScore != null && leadScore > 0 && (
                <LeadScoreBadge
                  score={leadScore}
                  className="cursor-help shrink-0"
                  title={`${t("chats.leadScore")}: ${leadScore}/100`}
                />
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatLastMessageAt(conversation.last_message_at)}
            </span>
          </div>
          {contactPhone && (
            <p className="text-xs text-muted-foreground/80 truncate tabular-nums tracking-tight">
              {contactPhone}
            </p>
          )}
          <p className="text-xs text-muted-foreground truncate">
            {conversation.last_message}
          </p>
          {conversation.tags && conversation.tags.length > 0 && (
            <TagChips tags={conversation.tags} maxVisible={2} className="mt-2" />
          )}
          {channel && (
            <p className="text-xs text-muted-foreground/70 truncate">
              {channel.name}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
})

interface ConversationListProps {
  conversations: Conversation[]
  channels: Channel[]
  isLoading?: boolean
  selectedConversationId?: number | null
  onConversationClick: (conversationId: number) => void
  emptyState?: {
    title: string
    description: string
  }
  selectionMode?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (conversationId: number) => void
}

export function ConversationList({
  conversations,
  channels,
  isLoading = false,
  selectedConversationId,
  onConversationClick,
  emptyState,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: ConversationListProps) {
  const { t } = useTranslation()
  const resolvedEmptyState = emptyState ?? {
    title: t("chats.noConversations"),
    description: t("chats.noConversationsDesc"),
  }

  // Build a channel lookup map for O(1) access
  const channelMap = useMemo(() => {
    const map = new Map<number, Channel>()
    for (const ch of channels) {
      map.set(ch.id, ch)
    }
    return map
  }, [channels])

  if (isLoading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <SkeletonList count={5} />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <EmptyState
          icon={MessageSquare}
          title={resolvedEmptyState.title}
          description={resolvedEmptyState.description}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <ConversationCard
            key={conversation.id}
            conversation={conversation}
            channel={conversation.channel || channelMap.get(conversation.channelId)}
            isSelected={selectedConversationId === conversation.id}
            onClick={onConversationClick}
            selectionMode={selectionMode}
            isChecked={selectedIds?.has(conversation.id) ?? false}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  )
}
