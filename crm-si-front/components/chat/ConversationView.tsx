'use client'

import { ConversationHeader } from './ConversationHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AISuggestions } from './AISuggestions'
import { ChatQuickBar } from '../ChatQuickBar'
import { Conversation } from '@/data/types'
import { sendMessage } from '@/lib/api/messages'
import { getConversationWithMessages } from '@/lib/api/conversations'
import { useToast } from '@/components/Toast'
import { aiSuggestions, teamMembers } from '@/data/constants'
import { useState } from 'react'

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
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)

    const handleSend = async () => {
        if (!message.trim() || isSending) return

        try {
            setIsSending(true)

            await sendMessage(conversation.id, message.trim())

            setMessage("")

            addToast({
                type: "success",
                title: "Mensaje enviado"
            })

            // Recargar conversación para obtener mensajes actualizados
            const updated = await getConversationWithMessages(conversation.id)
            onConversationUpdate(updated)

        } catch (error) {
            console.error('[ConversationView] Error sending message:', error)
            addToast({
                type: "error",
                title: "Error al enviar mensaje",
                description: error instanceof Error ? error.message : "Error desconocido"
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
                onBack={onBack}
                onOpenInfo={onOpenInfo}
            />

            <MessageList
                conversationId={conversation.id}
                messages={conversation.messages || []}
                isLoading={false}
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
                placeholder="Escribe un mensaje..."
            />

            <ChatQuickBar teamMembers={teamMembers} />
        </>
    )
}