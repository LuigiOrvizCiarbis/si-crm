import { Message } from "@/data/types"
import { useEffect, useRef, useLayoutEffect, useState } from "react"
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface MessageListProps {
  messages: Message[]
  onLoadMore: () => Promise<void>
  hasMore: boolean
  isLoadingMore: boolean
  onEditMessage?: (message: Message) => void
  onDeleteMessage?: (message: Message) => void
  currentUserId?: number
  isAdmin?: boolean
}

function parseTemplateContent(content: string): { isTemplate: boolean; title: string; body: string } {
  const trimmed = (content || "").trim()
  if (!trimmed) return { isTemplate: false, title: "", body: "" }
  const withoutLeadingIcons = trimmed.replace(/^[^A-Za-z0-9]+/, "").trim()

  if (trimmed.startsWith("📋")) {
    const withoutIcon = trimmed.replace(/^📋\s*/, "")
    if (withoutIcon.includes("\n")) {
      const [firstLine, ...rest] = withoutIcon.split("\n")
      return {
        isTemplate: true,
        title: `📋 ${firstLine.trim()}`,
        body: rest.join("\n").trim(),
      }
    }

    const legacyWithBody = withoutIcon.match(/^Template:\s*([^(]+)\s*\(([\s\S]+)\)$/i)
    if (legacyWithBody) {
      return {
        isTemplate: true,
        title: `📋 ${legacyWithBody[1].trim()}`,
        body: legacyWithBody[2].trim(),
      }
    }

    const legacyWithBodyNoClose = withoutIcon.match(/^Template:\s*([^(]+)\s*\(([\s\S]+)$/i)
    if (legacyWithBodyNoClose) {
      return {
        isTemplate: true,
        title: `📋 ${legacyWithBodyNoClose[1].trim()}`,
        body: legacyWithBodyNoClose[2].trim(),
      }
    }

    const legacyNameOnly = withoutIcon.match(/^Template:\s*([\s\S]+)$/i)
    if (legacyNameOnly) {
      return {
        isTemplate: true,
        title: `📋 ${legacyNameOnly[1].trim()}`,
        body: "",
      }
    }

    return {
      isTemplate: true,
      title: `📋 ${withoutIcon.trim()}`,
      body: "",
    }
  }

  const plainLegacy = withoutLeadingIcons.match(/^Template:\s*([^(]+)\s*\(([\s\S]+)\)$/i)
  if (plainLegacy) {
    return {
      isTemplate: true,
      title: `📋 ${plainLegacy[1].trim()}`,
      body: plainLegacy[2].trim(),
    }
  }

  const plainLegacyNoClose = withoutLeadingIcons.match(/^Template:\s*([^(]+)\s*\(([\s\S]+)$/i)
  if (plainLegacyNoClose) {
    return {
      isTemplate: true,
      title: `📋 ${plainLegacyNoClose[1].trim()}`,
      body: plainLegacyNoClose[2].trim(),
    }
  }

  const plainNameOnly = withoutLeadingIcons.match(/^Template:\s*([\s\S]+)$/i)
  if (plainNameOnly) {
    return {
      isTemplate: true,
      title: `📋 ${plainNameOnly[1].trim()}`,
      body: "",
    }
  }

  return { isTemplate: false, title: "", body: "" }
}

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Imagen completa"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function MessageBubbleImage({ mediaUrl, isUser }: { mediaUrl: string; isUser: boolean }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaUrl}
        alt="Imagen"
        className={`rounded-lg max-w-[240px] max-h-[240px] object-cover cursor-pointer hover:opacity-90 transition-opacity ${
          isUser ? "bg-primary/20" : "bg-muted"
        }`}
        onClick={() => setLightboxOpen(true)}
        loading="lazy"
      />
      {lightboxOpen && <ImageLightbox src={mediaUrl} onClose={() => setLightboxOpen(false)} />}
    </>
  )
}

export function MessageList({
  messages,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onEditMessage,
  onDeleteMessage,
  currentUserId,
  isAdmin,
}: MessageListProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)
  const lastMessageIdRef = useRef<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null)

  useLayoutEffect(() => {
    if (scrollRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = scrollRef.current.scrollHeight
      const diff = newScrollHeight - prevScrollHeightRef.current
      scrollRef.current.scrollTop = diff
      prevScrollHeightRef.current = 0
    }
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) return

    const lastMsg = messages[messages.length - 1]

    if (lastMsg.id !== lastMessageIdRef.current) {
      if (scrollRef.current) {
        const behavior = lastMessageIdRef.current === null ? "auto" : "smooth"
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: behavior
        })
      }
      lastMessageIdRef.current = lastMsg.id
    }
  }, [messages])

  const handleScroll = () => {
    if (!scrollRef.current) return

    const { scrollTop, scrollHeight } = scrollRef.current

    if (scrollTop === 0 && !isLoadingMore && hasMore) {
      prevScrollHeightRef.current = scrollHeight
      onLoadMore()
    }
  }

  const canEdit = (msg: Message) =>
    msg.sender_type === "user" &&
    msg.sender_id === currentUserId &&
    msg.direction === "outbound" &&
    (!msg.message_type || msg.message_type === "text") &&
    !msg.deleted_at

  const canDelete = (msg: Message) =>
    !msg.deleted_at &&
    (
      (msg.sender_type === "user" && msg.sender_id === currentUserId) ||
      isAdmin
    )

  const hasActions = (msg: Message) => canEdit(msg) || canDelete(msg)

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto min-h-0"
        onScroll={handleScroll}
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender_type === "user"
            const isDeleted = !!msg.deleted_at
            const isEdited = !!msg.edited_at && !isDeleted
            const hasOriginalContent =
              isEdited &&
              !!msg.original_content &&
              msg.original_content !== msg.content
            const imageUrl = msg.media_full_url || msg.media_url
            const isImage = msg.message_type === "image" && imageUrl
            const parsed = !isImage && !isDeleted ? parseTemplateContent(msg.content || "") : { isTemplate: false, title: "", body: "" }

            return (
              <div
                key={msg.id}
                className={`group/msg flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Action button - before bubble for user messages */}
                {isUser && hasActions(msg) && (
                  <div className="flex items-center mr-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit(msg) && onEditMessage && (
                          <DropdownMenuItem onClick={() => onEditMessage(msg)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t("chats.editMessage")}
                          </DropdownMenuItem>
                        )}
                        {canDelete(msg) && onDeleteMessage && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(msg)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("chats.deleteMessage")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                <div
                  className={`p-3 rounded-lg max-w-xs ${isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                    }`}
                >
                  {isDeleted ? (
                    <p className="text-sm italic opacity-60">
                      {t("chats.messageDeleted")}
                    </p>
                  ) : hasOriginalContent ? (
                    <div className="space-y-2">
                      <p className="text-xs opacity-70 line-through whitespace-pre-wrap">
                        {msg.original_content}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : isImage && imageUrl ? (
                    <div className="space-y-1">
                      <MessageBubbleImage mediaUrl={imageUrl} isUser={isUser} />
                      {msg.content && (
                        <p className="text-sm mt-1">{msg.content}</p>
                      )}
                    </div>
                  ) : parsed.isTemplate ? (
                    <div className="space-y-1">
                      <span className="text-xs font-medium opacity-75">
                        {parsed.title}
                      </span>
                      {parsed.body && (
                        <p className="text-sm whitespace-pre-wrap">
                          {parsed.body}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  {(msg.delivered_at || msg.created_at) && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.delivered_at || msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      {isEdited && (
                        <span className="text-xs text-muted-foreground opacity-70">
                          · {t("chats.edited")}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action button - after bubble for contact messages */}
                {!isUser && hasActions(msg) && (
                  <div className="flex items-center ml-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {canDelete(msg) && onDeleteMessage && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(msg)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("chats.deleteMessage")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chats.deleteMessageTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chats.deleteMessageConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget && onDeleteMessage) {
                  onDeleteMessage(deleteTarget)
                }
                setDeleteTarget(null)
              }}
            >
              {t("chats.deleteMessageAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
