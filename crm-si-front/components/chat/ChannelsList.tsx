'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from '@/components/chat/PlatformIcon'
import { EmptyState } from '@/components/EmptyState'
import { MessageSquare, Plus, Wifi, WifiOff } from 'lucide-react'
import { Channel, FilterType } from '@/data/types'
import { ChannelType, channelTypeToFilterType, getChannelDisplayName, filterTypeToChannelType } from '@/data/enums'
import {
  getChannelIdentifier,
  isChannelConnected,
  getChannelConversationsCount,
  canSendMessages,
} from '@/lib/utils/channelHelpers'
import { useMemo } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface ChannelsListProps {
  channels: Channel[]
  selectedChannel: number | null
  activeFilter: FilterType
  isLoading: boolean
  error: Error | null
  onChannelSelect: (channelId: number) => void
  onConnectChannel: () => void
  onRetry?: () => void
}

export function ChannelsList({
  channels,
  selectedChannel,
  activeFilter,
  isLoading,
  error,
  onChannelSelect,
  onConnectChannel,
  onRetry,
}: ChannelsListProps) {
  const { t } = useTranslation()

  const connectLabels: Record<FilterType, string> = {
    whatsapp: t("chats.connectWhatsApp"),
    instagram: t("chats.connectInstagram"),
    facebook: t("chats.connectFacebook"),
    linkedin: t("chats.connectLinkedIn"),
    telegram: t("chats.connectTelegram"),
    web: t("chats.connectWebChat"),
    mail: t("chats.connectMail"),
    manual: t("chats.connectManual"),
    todos: t("chats.connectChannel"),
    "no-leidos": t("chats.connectChannel"),
  }

  const { connected, disconnected } = useMemo(() => ({
    connected: channels.filter(isChannelConnected),
    disconnected: channels.filter(channel => !isChannelConnected(channel)),
  }), [channels])

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground text-sm">{t("chats.loadingChannels")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <EmptyState
          icon={MessageSquare}
          title={t("chats.errorChannels")}
          description={error.message}
          action={onRetry ? {
            label: t("chats.retry"),
            onClick: onRetry,
          } : undefined}
        />
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("chats.channels")} ({channels.length})
        </h3>
        {activeFilter !== "todos" && (
          <Badge variant="outline" className="text-xs">
            {getChannelDisplayName(filterTypeToChannelType(activeFilter) || ChannelType.MANUAL)}
          </Badge>
        )}
      </div>

      {/* Canales conectados */}
      {connected.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-3 h-3 text-green-600" />
            <p className="text-xs font-medium text-green-600">
              {t("chats.connected")} ({connected.length})
            </p>
          </div>

          {connected.map((channel) => (
            <Card
              key={channel.id}
              className={`p-3 cursor-pointer hover:bg-accent transition-colors ${selectedChannel === channel.id ? 'bg-accent border-primary' : ''
                }`}
              onClick={() => onChannelSelect(channel.id)}
            >
              <div className="flex items-center gap-3">
                <PlatformIcon
                  type={channelTypeToFilterType(channel.type)}
                  className="w-4 h-4"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{channel.user.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{getChannelDisplayName(channel.type)}</span>
                    {getChannelIdentifier(channel) && (
                      <>
                        <span>•</span>
                         <span className="truncate">{getChannelIdentifier(channel)}</span>
                         <span className="truncate">223 5876567</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!canSendMessages(channel.type) && (
                    <Badge variant="secondary" className="text-xs">
                      {t("chats.readOnly")}
                    </Badge>
                  )}

                  {getChannelConversationsCount(channel) > 0 && (
                    <Badge className="text-xs bg-blue-500">
                      {getChannelConversationsCount(channel)}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Canales desconectados */}
      {disconnected.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <WifiOff className="w-3 h-3 text-red-600" />
            <p className="text-xs font-medium text-red-600">
              {t("chats.disconnected")} ({disconnected.length})
            </p>
          </div>

          {disconnected.map((channel) => (
            <Card key={channel.id} className="p-3 opacity-60">
              <div className="flex items-center gap-3">
                <PlatformIcon
                  type={channelTypeToFilterType(channel.type)}
                  className="w-4 h-4"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{channel.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getChannelDisplayName(channel.type)} • {t("chats.disconnectedLabel")}
                  </p>
                </div>

                <Badge variant="destructive" className="text-xs">
                  Offline
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {channels.length === 0 && (
        <div className="mb-4">
          <EmptyState
            icon={MessageSquare}
            title={t("chats.noChannels")}
            description={`${t("chats.noChannelsDesc")}${activeFilter !== "todos" ? ` de ${getChannelDisplayName(filterTypeToChannelType(activeFilter) || ChannelType.MANUAL)}` : ""}`}
          />
        </div>
      )}

      {/* Botón conectar */}
      <Button
        variant="outline"
        className="w-full gap-2 bg-transparent"
        onClick={onConnectChannel}
      >
        <Plus className="w-4 h-4" />
        {connectLabels[activeFilter]}
      </Button>
    </div>
  )
}
