import { memo, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LeadScoreBadge } from "@/components/Badges"
import { PlatformIcon } from "@/components/chat/PlatformIcon"
import { EmptyState } from "@/components/EmptyState"
import { SkeletonList } from "@/components/Skeleton"
import { MessageSquare } from "lucide-react"
import { Conversation, Channel } from "@/data/types"
import { channelTypeToFilterType } from "@/data/enums"
import { useTranslation } from "@/hooks/useTranslation"

interface ConversationCardProps {
  conversation: Conversation
  channel?: Channel
  isSelected: boolean
  onClick: (id: number) => void
}

const ConversationCard = memo(function ConversationCard({
  conversation,
  channel,
  isSelected,
  onClick,
}: ConversationCardProps) {
  const { t } = useTranslation()

  const contactName = conversation.contact?.name || t("chats.unnamedContact")
  const leadScore = conversation.leadScore ?? null

  const initials = contactName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <Card
      className={`p-3 cursor-pointer hover:bg-accent transition-colors ${isSelected ? 'bg-accent border-primary' : ''}`}
      onClick={() => onClick(conversation.id)}
    >
      <div className="flex items-center gap-3">
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {contactName}
              </span>
              {leadScore != null && leadScore > 0 && (
                <LeadScoreBadge
                  score={leadScore}
                  className="cursor-help"
                  title={`${t("chats.leadScore")}: ${leadScore}/100`}
                />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {conversation.last_message_at
                ? new Date(conversation.last_message_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.last_message}
          </p>
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
}

export function ConversationList({
  conversations,
  channels,
  isLoading = false,
  selectedConversationId,
  onConversationClick,
  emptyState,
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
          />
        ))}
      </div>
    </div>
  )
}
