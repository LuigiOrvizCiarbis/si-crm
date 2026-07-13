'use client'

import { ConversationHeader } from './ConversationHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AISuggestions } from './AISuggestions'
import { Conversation, TranslationLanguage } from '@/data/types'
import { sendMessage, translateMessage } from '@/lib/api/messages'
import { getConversationWithMessages, setConversationTranslationLanguage, translateDraft } from '@/lib/api/conversations'
import { isExpectedBusinessErrorMessage } from '@/lib/observability/sentry'
import { useToast } from '@/components/Toast'
import { aiSuggestions } from '@/data/constants'
import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/store/useAuthStore'

interface ConversationViewProps {
    conversation: Conversation
    onBack: () => void
    onOpenInfo: () => void
    onConversationUpdate: (conversation: Conversation) => void
}

/**
 * Vista completa de una conversación individual.
 * Encapsula toda la lógica de mensajería.
 */
export function ConversationView({
    conversation,
    onBack,
    onOpenInfo,
    onConversationUpdate,
}: ConversationViewProps) {
    const { addToast } = useToast()
    const { t, language } = useTranslation()
    const authUser = useAuthStore((state) => state.user)
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [contactLanguage, setContactLanguage] = useState<TranslationLanguage>(conversation.contactLanguage ?? "es")

    const expansionContext = {
        contactName: conversation.contact?.name ?? null,
        userName: authUser?.name ?? null,
        tenantName: authUser?.tenant?.name ?? null,
    }

    const handleSend = async () => {
        if (!message.trim() || isSending) return

        try {
            setIsSending(true)

            await sendMessage(conversation.id, message.trim())

            setMessage("")

            addToast({
                type: "success",
                title: t("chats.messageSent"),
            })

            // Recargar conversación para obtener mensajes actualizados
            const updated = await getConversationWithMessages(conversation.id)
            onConversationUpdate(updated)

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : undefined
            if (!isExpectedBusinessErrorMessage(errorMessage)) {
                console.error('[ConversationView] Error sending message:', error)
            }
            addToast({
                type: "error",
                title: t("chats.sendMessageError"),
                description: errorMessage || t("chats.unknownError"),
            })
        } finally {
            setIsSending(false)
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        setMessage(suggestion)
    }

    return (
        <>
            <ConversationHeader
                conversation={conversation}
                isContactInfoOpen={false}
                onBack={onBack}
                onToggleContactInfo={onOpenInfo}
            />

            <MessageList
                messages={conversation.messages || []}
                onLoadMore={async () => undefined}
                hasMore={false}
                isLoadingMore={false}
                translationLanguage={language}
                onTranslateMessage={(targetMessage, targetLanguage) => translateMessage(targetMessage.id, targetLanguage)}
            />

            <AISuggestions
                suggestions={aiSuggestions}
                onSuggestionClick={handleSuggestionClick}
            />

            <MessageInput
                value={message}
                onChange={setMessage}
                onSend={handleSend}
                disabled={isSending}
                placeholder={t("chats.messagePlaceholder")}
                expansionContext={expansionContext}
                conversationId={conversation.id}
                contactLanguage={contactLanguage}
                onContactLanguageChange={async (nextLanguage) => {
                    const previous = contactLanguage
                    setContactLanguage(nextLanguage)
                    try {
                        await setConversationTranslationLanguage(conversation.id, nextLanguage)
                        onConversationUpdate({ ...conversation, contactLanguage: nextLanguage })
                    } catch (error) {
                        setContactLanguage(previous)
                        addToast({
                            type: "error",
                            title: t("chats.languageSaveError"),
                            description: error instanceof Error ? error.message : undefined,
                        })
                    }
                }}
                onTranslateDraft={async (content, targetLanguage) => {
                    const result = await translateDraft(conversation.id, content, targetLanguage)
                    return result.translated_content
                }}
            />
        </>
    )
}
