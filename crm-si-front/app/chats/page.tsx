"use client"

import { SidebarLayout } from "@/components/SidebarLayout"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { ChatFilters } from "@/components/chat/ChatFilters"
import { WizardConnectChannel } from "@/components/WizardConnectChannel"
import { ContactInfoPanel } from "@/components/ContactInfoPanel"
import { useFacebookSDK } from "@/hooks/useFacebookSDK"
import { useChatState } from "@/hooks/useChatState"
import { useToast } from "@/components/Toast"
//import { channels, conversations } from "@/data/mockData"
import { FilterType, Channel, Conversation, Message } from "@/data/types"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ChatQuickBar } from "@/components/ChatQuickBar"
import { getChannelConversations, getConversationMessages, getConversations, getConversationWithMessages, getUserConversations } from "@/lib/api/conversations"
import { sendMessage } from "@/lib/api/messages"
// import { configureEcho, useEcho } from "@laravel/echo-react";
import { ConversationHeader } from "@/components/chat/ConversationHeader"
import { AISuggestions } from "@/components/chat/AISuggestions"
import { MessageList } from "@/components/chat/MessageList"
import { MessageInput } from "@/components/chat/MessageInput"
import { ConversationList } from "@/components/chat/ConversationList"
import { FilteredConversationsHeader } from "@/components/chat/FilteredConversationsHeader"
import { ChannelsList } from "@/components/chat/ChannelsList"
import { getChannels } from "@/lib/api/channels"
import { filterTypeToChannelType } from "@/data/enums"
import { ChannelHeader } from "@/components/chat/AccountHeader"
import { useConversationFilters } from "@/hooks/useConversationFilters"
import { useSSEMessages } from "@/hooks/useSSEMessages"
import { useTenantSSE } from "@/hooks/useTenantSSE"
import { useTranslation } from "@/hooks/useTranslation"

export default function ChatsPage() {
  const { addToast, removeToast, ToastContainer } = useToast()
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { launchWhatsAppSignup } = useFacebookSDK()
  const { chatStates, ...chatHandlers } = useChatState()

  const chatIdFromUrl = searchParams.get("chat")



  const chatIdNumber = chatIdFromUrl ? parseInt(chatIdFromUrl, 10) : null


  const [selectedChannel, setSelectedChannel] = useState<number | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null)
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [wizardOpen, setWizardOpen] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversation, setConversation] = useState<any>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(chatIdNumber)

  const activeConversation = conversations.find((c) => c.id === selectedConversationId)
  const activeChannel = channels.find((channel) => channel.id === selectedChannelId)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const localizedAiSuggestions = [t("chats.aiSuggestion1"), t("chats.aiSuggestion2"), t("chats.aiSuggestion3")]

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);


  const handleRealTimeMessage = useCallback((newMessage: Message) => {
    // 1. Actualizar el chat abierto (si coincide el ID)
    if (selectedConversationId === newMessage.conversation_id) {
      setConversation((prev: any) => {
        if (!prev) return prev;

        // Evitar duplicados: Si el mensaje ya existe por ID
        if (prev.messages && prev.messages.some((m: Message) => m.id === newMessage.id)) {
          return prev;
        }

        // Reemplazar mensaje optimista si existe uno con el mismo contenido
        const optimisticIndex = prev.messages?.findIndex((m: any) =>
          m.status === 'sending' &&
          m.content === newMessage.content &&
          Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000 // Dentro de 5 segundos
        );

        if (optimisticIndex !== -1) {
          // Reemplazar mensaje optimista con el real del servidor
          const updatedMessages = [...prev.messages];
          updatedMessages[optimisticIndex] = newMessage;
          return {
            ...prev,
            messages: updatedMessages
          };
        }

        // Agregar como mensaje nuevo
        return {
          ...prev,
          messages: [...(prev.messages || []), newMessage]
        };
      });
    }

    // 2. Actualizar la lista de conversaciones (Sidebar)
    setConversations(prevConversations => {
      const index = prevConversations.findIndex(c => c.id === newMessage.conversation_id);
      if (index === -1) return prevConversations;

      const updatedConversation = {
        ...prevConversations[index],
        last_message: newMessage.content,
        updated_at: newMessage.created_at,
      };

      const newConversations = [...prevConversations];
      newConversations.splice(index, 1);
      return [updatedConversation, ...newConversations];
    });
  }, [selectedConversationId]);



  const authToken = (() => { const s = localStorage.getItem("auth-storage"); try { return s ? JSON.parse(s)?.state?.token ?? "" : ""; } catch { return ""; } })();

  useSSEMessages({
    conversationId: selectedConversationId,
    token: authToken,
    onMessage: handleRealTimeMessage
  });

  const selectedChannelIdRef = useRef(selectedChannelId);
  useEffect(() => { selectedChannelIdRef.current = selectedChannelId; }, [selectedChannelId]);

  const tenantRefreshVersionRef = useRef(0);

  const handleTenantMessage = useCallback((message: Message) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === message.conversation_id);
      if (idx !== -1) {
        const updated = {
          ...prev[idx],
          last_message: message.content,
          updated_at: message.created_at,
        };
        const next = [...prev];
        next.splice(idx, 1);
        return [updated, ...next];
      }
      // New conversation — refetch respecting the active channel filter
      const channelId = selectedChannelIdRef.current;
      const version = ++tenantRefreshVersionRef.current;
      const fetcher = channelId ? getChannelConversations(channelId) : getConversations();
      fetcher.then(data => {
        if (version !== tenantRefreshVersionRef.current) return;
        if (selectedChannelIdRef.current !== channelId) return;
        setConversations(data);
      }).catch(() => {});
      return prev;
    });
  }, []);

  useTenantSSE({
    token: authToken,
    onMessage: handleTenantMessage,
  });

  const handleLoadMoreMessages = async () => {
    if (!selectedConversationId || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      // Llamamos a la API pidiendo la siguiente página
      const response = await getConversationMessages(selectedConversationId, nextPage)

      // Asumiendo que Laravel devuelve { data: [], last_page: X }
      // Si tu API devuelve directo el array, ajusta esto.
      const newMessages = response.data || []
      const lastPage = response.last_page || 1

      if (newMessages.length > 0) {
        setConversation((prev: any) => {
          if (!prev) return prev;

          // Filtramos duplicados por ID para seguridad
          const existingIds = new Set(prev.messages.map((m: any) => m.id));
          const uniqueNewMessages = newMessages.filter((m: any) => !existingIds.has(m.id));

          // Ordenamos cronológicamente (ID ascendente)
          // Combinamos: [Nuevos (Viejos en tiempo), ...Existentes]
          const combinedMessages = [...uniqueNewMessages, ...prev.messages].sort((a: any, b: any) => a.id - b.id);

          return {
            ...prev,
            messages: combinedMessages
          };
        });

        setPage(nextPage)
        setHasMore(nextPage < lastPage)
      } else {
        setHasMore(false)
      }

    } catch (error) {
      console.error("Error cargando más mensajes:", error)
      addToast({ type: "error", title: t("chats.loadHistoryError") })
    } finally {
      setIsLoadingMore(false)
    }
  }


  const {
    filteredConversations,
    filteredChannels,
    connectedChannels,
    disconnectedChannels,
  } = useConversationFilters({
    conversations,
    channels,
    activeFilter,
    selectedChannelId,
  })

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoading(true)
        const data = await getChannels()

        setChannels(data)

      } catch (error) {
        addToast({
          type: "error",
          title: t("chats.loadAccountsError"),
          description: error instanceof Error ? error.message : t("chats.loadAccountsErrorDesc"),
        })
        setChannels([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchChannels()
  }, [])

  useEffect(() => {
    const CONNECTING_TOAST_ID = "channel-connecting"

    const onConnecting = () => {
      addToast({ id: CONNECTING_TOAST_ID, type: "loading", title: t("chats.channelConnecting"), description: t("chats.channelConnectingDesc") })
    }

    const onConnected = async () => {
      removeToast(CONNECTING_TOAST_ID)
      try {
        const data = await getChannels()
        setChannels(data)
        addToast({ type: "success", title: t("chats.channelConnected"), description: t("chats.channelConnectedDesc") })
      } catch (e) {
        console.error("Error refetching channels:", e)
      }
    }

    const onError = () => {
      removeToast(CONNECTING_TOAST_ID)
      addToast({ type: "error", title: t("chats.channelError"), description: t("chats.channelErrorDesc") })
    }

    window.addEventListener("channel-connecting", onConnecting)
    window.addEventListener("channel-connected", onConnected)
    window.addEventListener("channel-error", onError)
    return () => {
      window.removeEventListener("channel-connecting", onConnecting)
      window.removeEventListener("channel-connected", onConnected)
      window.removeEventListener("channel-error", onError)
    }
  }, [])

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true)
        const data = await getConversations()

        setConversations(data)

      } catch (error) {
        addToast({
          type: "error",
          title: t("chats.loadAccountsError"),
          description: error instanceof Error ? error.message : t("chats.loadAccountsErrorDesc"),
        })
        setConversations([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

  useEffect(() => {
    if (!selectedConversationId) {
      setCurrentConversation(null)
      return
    }

    const fetchConversation = async () => {
      try {
        const data = await getConversationWithMessages(selectedConversationId)
        setCurrentConversation(data)
      } catch (error) {
        console.error('[ChatsPage] Error loading conversation:', error)
        addToast({
          type: "error",
          title: t("chats.loadConversationError"),
          description: error instanceof Error ? error.message : t("chats.unknownError"),
        })
      }
    }

    fetchConversation()
  }, [selectedConversationId])

  useEffect(() => {
    if (chatIdFromUrl) {
      const id = parseInt(chatIdFromUrl, 10)
      setSelectedConversationId(id)
    } else {
      setSelectedConversationId(null)  // ← Se limpia cuando URL no tiene ?chat=
    }
  }, [chatIdFromUrl])

  useEffect(() => {
    if (!selectedChannelId) {
      // Si no hay canal seleccionado, no hacer nada (las conversaciones ya se cargaron)
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        // Filtrar conversaciones por channel_id
        const data = await getChannelConversations(selectedChannelId);

        if (!cancelled) setConversations(data);
      } catch (e) {
        addToast({ type: "error", title: t("chats.loadConversationsError") });
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [selectedChannelId]);

  useEffect(() => {
    if (!selectedConversationId || selectedConversationId === null) {
      setConversation(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const data = await getConversationWithMessages(selectedConversationId);
        if (!cancelled) setConversation(data);
      } catch (e) {
        addToast({ type: "error", title: t("chats.loadConversationError") });
        if (!cancelled) setConversation(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();



    return () => { cancelled = true };
  }, [selectedConversationId]);


  // Handlers de eventos
  const handleConnectChannel = () => {
    if (activeFilter === "whatsapp") {
      launchWhatsAppSignup()
    } else {
      setWizardOpen(true)
    }
  }

  const handleImportTemplates = () => {
    addToast({
      type: "success",
      title: t("chats.templatesImported"),
      description: t("chats.templatesImportedDesc"),
    })
  }

  const handleNewChat = () => {
    addToast({
      type: "success",
      title: t("chats.newChatStarted"),
      description: t("chats.newChatStartedDesc"),
    })
  }

  const handleFilterChange = (filter: FilterType) => {
    tenantRefreshVersionRef.current++
    setActiveFilter(filter)
    setSelectedChannel(null)
    setSelectedConversationId(null)
    setSelectedChannelId(null)
    router.replace("/chats")
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
    addToast({
      type: "info",
      title: t("chats.aiSuggestionApplied"),
      description: t("chats.aiSuggestionAppliedDesc"),
    })
  }

  const handleConversationClick = (conversationId: number) => {
    setSelectedConversationId(conversationId)
    router.push(`/chats?chat=${conversationId}`)
  }

  const handleBackToConversations = useCallback(() => {
    setSelectedConversationId(null)
    router.replace("/chats")
  }, [router])

  const handleBackToChannels = useCallback(() => {
    tenantRefreshVersionRef.current++
    setSelectedChannelId(null)
    setSelectedConversationId(null)
    router.replace("/chats")
  }, [router])

  const handleChannelSelect = useCallback((channelId: number) => {
    tenantRefreshVersionRef.current++
    setSelectedChannelId(channelId)

    setSelectedConversationId(null)

    router.replace("/chats")

  }, [router])

  const getFilteredChannels = () => {
    if (activeFilter === "todos" || activeFilter === "no-leidos") {
      return channels
    }
    return channels.filter((channel) => channel.type === filterTypeToChannelType(activeFilter))
  }

  const filteredAccounts = getFilteredChannels()

  const disconnectedAccounts = filteredAccounts.filter((channel) => channel.status === "disconnected")

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversationId) return;

    const textToSend = message.trim();

    // 🚀 PASO 1: Limpiar input INMEDIATAMENTE (esto es clave para la sensación de velocidad)
    setMessage("");

    // 🚀 PASO 2: Crear mensaje optimista con ID temporal
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: any = {
      id: tempId,
      content: textToSend,
      role: "assistant", // O "user" según tu lógica
      type: "text",
      created_at: new Date().toISOString(),
      status: "sending", // Estado para mostrar indicador de "enviando..."
      conversation_id: selectedConversationId,
      direction: "outbound",
      sender_type: "user"
    };

    // 🚀 PASO 3: Actualizar UI inmediatamente (chat activo)
    setConversation((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), optimisticMessage]
      };
    });

    // 🚀 PASO 4: Actualizar UI inmediatamente (sidebar)
    setConversations((prevConversations) => {
      const index = prevConversations.findIndex(c => c.id === selectedConversationId);
      if (index === -1) return prevConversations;

      const updatedConversation = {
        ...prevConversations[index],
        last_message: textToSend,
        updated_at: new Date().toISOString(),
      };

      const newConversations = [...prevConversations];
      newConversations.splice(index, 1);
      return [updatedConversation, ...newConversations];
    });

    // 🚀 PASO 5: Enviar al backend en segundo plano
    try {
      await sendMessage(selectedConversationId, textToSend);

      // El mensaje real llegará por SSE y reemplazará el optimista
      // gracias a la lógica en handleRealTimeMessage

    } catch (error) {
      console.error('[ChatsPage] Error sending message:', error);

      // 🚨 PASO 6: Si falla, revertir cambios
      addToast({
        type: "error",
        title: t("chats.sendMessageError"),
        description: error instanceof Error ? error.message : t("chats.sendMessageErrorDesc")
      });

      // Restaurar el texto en el input
      setMessage(textToSend);

      // Remover el mensaje optimista
      setConversation((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((m: any) => m.id !== tempId)
        };
      });

      // Revertir actualización del sidebar
      setConversations((prevConversations) => {
        const index = prevConversations.findIndex(c => c.id === selectedConversationId);
        if (index === -1) return prevConversations;

        const conversation = prevConversations[index];
        const previousMessage = conversation.messages?.[conversation.messages.length - 2]; // Obtener mensaje anterior

        return prevConversations.map(c =>
          c.id === selectedConversationId
            ? { ...c, last_message: previousMessage?.content || '', updated_at: previousMessage?.created_at }
            : c
        );
      });
    }
  };



  return (
    <SidebarLayout>
      {/* Header */}
      <ChatHeader
        activeFilter={activeFilter}
        onConnectChannel={handleConnectChannel}
        onImportTemplates={handleImportTemplates}
        onNewChat={handleNewChat}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <ChatFilters
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />

          <div className="flex-1 overflow-y-auto">
            <ChannelsList
              channels={connectedChannels.concat(disconnectedAccounts)}
              selectedChannel={selectedChannel}
              activeFilter={activeFilter}
              isLoading={isLoading}
              error={null}
              onChannelSelect={handleChannelSelect}
              onConnectChannel={handleConnectChannel}
            />
          </div>
        </div>

        {/* Panel principal */}
        <div className="flex-1 bg-background flex flex-col overflow-hidden min-h-0">

          {!selectedChannelId && !selectedConversationId && (
            <FilteredConversationsHeader activeFilter={activeFilter} />
          )}

          {selectedChannelId && !selectedConversationId && activeChannel && (

            <ChannelHeader
              channel={activeChannel}
              conversationCount={filteredConversations.length}
              onBack={handleBackToChannels}
            />
          )}

          {!selectedConversationId && (
            <>

              <ConversationList
                conversations={filteredConversations}
                channels={channels}
                isLoading={isLoading}
                selectedConversationId={selectedConversationId}
                onConversationClick={handleConversationClick}
                emptyState={{
                  title: t("chats.noConversations"),
                  description: selectedChannelId
                    ? `${activeChannel?.name}`
                    : t("chats.noConversationsDesc"),
                }}
              />
            </>
          )}

          {selectedConversationId && currentConversation && activeConversation && selectedConversationId && (

            <>
              <ConversationHeader
                conversation={activeConversation}
                isContactInfoOpen={isContactInfoOpen}
                onBack={handleBackToConversations}
                onToggleContactInfo={() => setIsContactInfoOpen(!isContactInfoOpen)}
              />
              {/* Quick Bar */}
              <ChatQuickBar
                chatId={selectedConversationId}
                value={{
                  stageId: currentConversation?.pipeline_stage_id,
                  priority: currentConversation?.priority,
                  assigneeId: currentConversation?.assigneeId,
                  unread: currentConversation?.unread,
                  archived: currentConversation?.archived,
                }}
                team={[]}
                onChangeStage={(stage) => {
                  chatHandlers.handleChangeStage(selectedConversationId)(stage)
                  setCurrentConversation(prev => prev ? { ...prev, pipeline_stage_id: stage } : prev)
                }}
                onChangePriority={(priority) => {
                  chatHandlers.handleChangePriority(selectedConversationId)(priority)
                  setCurrentConversation(prev => prev ? { ...prev, priority } : prev)
                }}
                onChangeAssignee={(assigneeId) => {
                  chatHandlers.handleChangeAssignee(selectedConversationId)(assigneeId)
                  // Actualizar currentConversation localmente
                  setCurrentConversation(prev => prev ? { ...prev, assigneeId: String(assigneeId) } : prev)
                }}
                onMarkRead={chatHandlers.handleMarkRead(selectedConversationId)}
                onToggleArchive={chatHandlers.handleToggleArchive(selectedConversationId)}
              />
              <AISuggestions
                suggestions={localizedAiSuggestions}
                onSuggestionClick={handleSuggestionClick}
              />

              <MessageList
                messages={conversation?.messages || []}
                onLoadMore={handleLoadMoreMessages}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
              />
              <MessageInput
                value={message}
                onChange={setMessage}
                onSend={handleSendMessage}
                disabled={isLoading}
              />
            </>


          )}

        </div>

        {/* Panel de información de contacto */}
        {selectedConversationId && (
          <ContactInfoPanel
            contactId={selectedConversationId}
            isOpen={isContactInfoOpen}
            onClose={() => setIsContactInfoOpen(false)}
          />
        )}
      </div>

      {/* Wizard de conexión */}
      <WizardConnectChannel open={wizardOpen} onOpenChange={setWizardOpen} />
      <ToastContainer />
    </SidebarLayout>
  )
}
