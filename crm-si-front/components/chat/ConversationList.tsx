import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LeadScoreBadge } from "@/components/Badges"
import { PlatformIcon } from "@/components/chat/PlatformIcon"
import { EmptyState } from "@/components/EmptyState"
import { SkeletonList } from "@/components/Skeleton"
import { MessageSquare } from "lucide-react"
import { Conversation, Channel } from "@/data/types"
import { channelTypeToFilterType } from "@/data/enums"

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
  emptyState = {
    title: "No hay conversaciones",
    description: "Esta cuenta no tiene conversaciones activas",
  },
}: ConversationListProps) {

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
          title={emptyState.title}
          description={emptyState.description}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="space-y-2">
        {conversations.map((conversation) => {

          const contactName = conversation.contact?.name || conversation.contact.name || "Sin nombre"

          const channel = conversation.channel || channels.find((ch) => ch.id === conversation.channelId)

          const initials = contactName
            .split(" ")
            .map((name) => name[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()

          // ✅ Determinar si hay mensajes no leídos
          //const hasUnread = conversation.unread ?? (conversation.unread_count && conversation.unread_count > 0) ?? false

          return (
            <Card
              key={conversation.id}
              className={`p-3 cursor-pointer hover:bg-accent transition-colors ${selectedConversationId === conversation.id ? 'bg-accent border-primary' : ''
                }`}
              onClick={() => onConversationClick(conversation.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {/* ✅ Ícono de plataforma desde el tipo de canal */}
                  {channel && (
                    <PlatformIcon
                      type={channelTypeToFilterType(channel.type)}
                      className="w-4 h-4"
                    />
                  )}

                  {/* ✅ Avatar con iniciales */}
                  <Avatar className="w-8 h-8 bg-muted">
                    <AvatarFallback className="text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {/* ✅ Nombre del contacto */}
                      <span className="font-medium text-sm truncate">
                        {contactName}
                      </span>

                      {/* ✅ Badge de lead score opcional */}
                        <LeadScoreBadge
                          score={conversation.leadScore ?? 90}
                          className="cursor-help"
                          title={`Lead Score: ${conversation.leadScore}/100`}
                        />
                    </div>

                    {/* ✅ Timestamp formateado */}
                    <span className="text-xs text-muted-foreground">
                      {conversation.last_message_at
                        ? new Date(conversation.last_message_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </span>
                  </div>

                  {/* ✅ Último mensaje */}
                  <p className="text-xs text-muted-foreground truncate">
                    {conversation.last_message}
                  </p>

                  {/* ✅ Nombre del canal */}
                  {channel && (
                    <p className="text-xs text-muted-foreground/70 truncate">
                      {channel.name}
                    </p>
                  )}
                </div>

                {/* ✅ Indicador de no leído */}
                {/* {hasUnread && (
                  <div className="flex items-center gap-2">
                    {conversation.unread_count && conversation.unread_count > 0 ? (
                      <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {conversation.unread_count}
                      </div>
                    ) : (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                    )}
                  </div>
                )} */}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}