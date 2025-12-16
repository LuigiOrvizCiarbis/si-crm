"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { LeadScoreBadge, Badge } from "@/components/Badges"
import { EmptyState } from "@/components/EmptyState"
import { SkeletonList } from "@/components/Skeleton"
import { WizardConnectChannel } from "@/components/WizardConnectChannel"
import { ChatQuickBar } from "@/components/ChatQuickBar"
import { ContactInfoPanel } from "@/components/ContactInfoPanel"
import { useToast } from "@/components/Toast"
import { ChatCreateTaskButton } from "@/components/ChatCreateTaskButton"
import { ChevronLeft, User, MoreVertical, Paperclip, Smile, Send } from "lucide-react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getChannelIcon } from "@/lib/channel-icons"
import { SidebarLayout } from "@/components/sidebar-layout"

interface Account {
  id: string
  name: string
  platform: "whatsapp" | "instagram" | "facebook" | "linkedin" | "telegram" | "web" | "mail"
  status: "connected" | "disconnected"
  phone?: string
  conversationsCount: number
}

interface Conversation {
  id: string
  accountId: string
  contactName: string
  lastMessage: string
  timestamp: string
  unread: boolean
  leadScore?: number
  stage?: "nuevo" | "calificado" | "demo" | "cierre"
  priority?: "baja" | "media" | "alta" | "hot"
  assigneeId?: string
  archived?: boolean
  contactId?: string // Added for ContactInfoPanel
}

const accounts: Account[] = [
  // WhatsApp
  {
    id: "wp1",
    name: "Lucas - SI BA 11 5956-6891",
    platform: "whatsapp",
    status: "connected",
    phone: "+54 9 11 5956-6891",
    conversationsCount: 5,
  },
  {
    id: "wp2",
    name: "Luigi - SI MDP 223 595-2655",
    platform: "whatsapp",
    status: "connected",
    phone: "+54 9 223 595-2655",
    conversationsCount: 3,
  },
  {
    id: "wp3",
    name: "Comercial - SI MDP 223 580-2155",
    platform: "whatsapp",
    status: "connected",
    phone: "+54 9 223 580-2155",
    conversationsCount: 8,
  },
  {
    id: "wp4",
    name: "Comercial - SI Esp +34 642 99-0818",
    platform: "whatsapp",
    status: "connected",
    phone: "+34 642 99-0818",
    conversationsCount: 4,
  },
  {
    id: "wp5",
    name: "BA Mobility Tech Cluster 11 xxxx-xxxx",
    platform: "whatsapp",
    status: "connected",
    phone: "+54 9 11 xxxx-xxxx",
    conversationsCount: 2,
  },

  // Instagram / Facebook
  {
    id: "ig1",
    name: "Social Impulse Agency",
    platform: "instagram",
    status: "connected",
    conversationsCount: 6,
  },
  {
    id: "ig2",
    name: "CIARBIS Soluciones",
    platform: "instagram",
    status: "connected",
    conversationsCount: 4,
  },
  {
    id: "ig3",
    name: "BA Mobility Tech Cluster",
    platform: "instagram",
    status: "connected",
    conversationsCount: 3,
  },
  {
    id: "ig4",
    name: "MovilUp",
    platform: "instagram",
    status: "connected",
    conversationsCount: 5,
  },
  {
    id: "fb1",
    name: "Social Impulse Agency",
    platform: "facebook",
    status: "connected",
    conversationsCount: 4,
  },
  {
    id: "fb2",
    name: "CIARBIS Soluciones",
    platform: "facebook",
    status: "connected",
    conversationsCount: 3,
  },
  {
    id: "fb3",
    name: "BA Mobility Tech Cluster",
    platform: "facebook",
    status: "connected",
    conversationsCount: 2,
  },
  {
    id: "fb4",
    name: "MovilUp",
    platform: "facebook",
    status: "connected",
    conversationsCount: 4,
  },

  // LinkedIn
  {
    id: "li1",
    name: "Luis Miguel Orviz",
    platform: "linkedin",
    status: "connected",
    conversationsCount: 3,
  },
  {
    id: "li2",
    name: "Lucas Lionel Coria",
    platform: "linkedin",
    status: "connected",
    conversationsCount: 2,
  },
  {
    id: "li3",
    name: "Social Impulse Agency",
    platform: "linkedin",
    status: "connected",
    conversationsCount: 4,
  },
  {
    id: "li4",
    name: "CIARBIS Soluciones",
    platform: "linkedin",
    status: "connected",
    conversationsCount: 3,
  },
  {
    id: "li5",
    name: "BA Mobility Tech Cluster",
    platform: "linkedin",
    status: "connected",
    conversationsCount: 5,
  },
  {
    id: "li6",
    name: "MovilUp",
    platform: "linkedin",
    status: "connected",
    conversationsCount: 4,
  },
  {
    id: "li7",
    name: "Vegans&Veggie",
    platform: "linkedin",
    status: "connected",
    conversationsCount: 2,
  },
  {
    id: "li8",
    name: "Loopy",
    platform: "linkedin",
    status: "connected",
    conversationsCount: 3,
  },

  // Web forms and chats
  {
    id: "web1",
    name: "Chat Web 1",
    platform: "web",
    status: "connected",
    conversationsCount: 15,
  },
  {
    id: "web2",
    name: "Chat Web 2",
    platform: "web",
    status: "connected",
    conversationsCount: 8,
  },
  {
    id: "web3",
    name: "Form Web Contacto",
    platform: "web",
    status: "connected",
    conversationsCount: 12,
  },
]

const conversations: Conversation[] = [
  {
    id: "conv1",
    accountId: "wp1",
    contactName: "María González",
    lastMessage: "¿Está disponible el departamento?",
    timestamp: "14:30",
    unread: true,
    leadScore: 85,
    stage: "nuevo",
    priority: "alta",
    assigneeId: "me",
    archived: false,
    contactId: "contact1",
  },
  {
    id: "conv2",
    accountId: "wp1",
    contactName: "Carlos Pérez",
    lastMessage: "Perfecto, nos vemos mañana",
    timestamp: "13:45",
    unread: false,
    leadScore: 90,
    stage: "demo",
    priority: "hot",
    assigneeId: "v1",
    archived: false,
    contactId: "contact2",
  },
  {
    id: "conv3",
    accountId: "wp2",
    contactName: "Ana Martín",
    lastMessage: "¿Tienen stock disponible?",
    timestamp: "14:15",
    unread: true,
    leadScore: 75,
    stage: "calificado",
    priority: "media",
    assigneeId: "v2",
    archived: false,
    contactId: "contact3",
  },
  {
    id: "conv4",
    accountId: "wp3",
    contactName: "Roberto Silva",
    lastMessage: "Excelente propuesta",
    timestamp: "12:30",
    unread: false,
    leadScore: 80,
    contactId: "contact4",
  },
  {
    id: "conv5",
    accountId: "ig1",
    contactName: "Laura Díaz",
    lastMessage: "Me interesa la propiedad",
    timestamp: "11:20",
    unread: true,
    leadScore: 95,
    contactId: "contact5",
  },
  {
    id: "conv6",
    accountId: "web1",
    contactName: "Pedro Martínez",
    lastMessage: "Hola, necesito información sobre sus servicios",
    timestamp: "15:45",
    unread: true,
    leadScore: 88,
    contactId: "contact6",
  },
  {
    id: "conv7",
    accountId: "web1",
    contactName: "Sofía López",
    lastMessage: "¿Cuáles son sus horarios de atención?",
    timestamp: "15:30",
    unread: false,
    leadScore: 92,
    contactId: "contact7",
  },
  {
    id: "conv8",
    accountId: "web1",
    contactName: "Miguel Torres",
    lastMessage: "Quiero solicitar una cotización",
    timestamp: "15:15",
    unread: true,
    leadScore: 83,
    contactId: "contact8",
  },
  {
    id: "conv9",
    accountId: "web3",
    contactName: "Elena Rodríguez",
    lastMessage: "Formulario de contacto completado",
    timestamp: "14:20",
    unread: false,
    leadScore: 97,
    contactId: "contact9",
  },
  {
    id: "conv10",
    accountId: "web3",
    contactName: "Javier Morales",
    lastMessage: "Solicitud de información enviada",
    timestamp: "13:50",
    unread: true,
    leadScore: 89,
    contactId: "contact10",
  },
  {
    id: "conv11",
    accountId: "web3",
    contactName: "Carmen Vega",
    lastMessage: "Formulario de presupuesto completado",
    timestamp: "13:20",
    unread: false,
    leadScore: 91,
    contactId: "contact11",
  },
  {
    id: "conv12",
    accountId: "web2",
    contactName: "Ricardo Herrera",
    lastMessage: "¿Tienen descuentos disponibles?",
    timestamp: "12:45",
    unread: true,
    leadScore: 84,
    contactId: "contact12",
  },
  {
    id: "conv13",
    accountId: "web2",
    contactName: "Patricia Ruiz",
    lastMessage: "Gracias por la información",
    timestamp: "12:10",
    unread: false,
    leadScore: 93,
    contactId: "contact13",
  },
]

export default function ChatsPage() {
  const { addToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const chatIdFromUrl = searchParams.get("chat")

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(chatIdFromUrl)
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<
    "todos" | "no-leidos" | "whatsapp" | "instagram" | "facebook" | "linkedin" | "telegram" | "web" | "mail"
  >("todos")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [wizardOpen, setWizardOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [shouldShowAllConversations, setShouldShowAllConversations] = useState(false)

  useEffect(() => {
    const handleConnectChannel = () => {
      setWizardOpen(true)
    }

    const handleTemplates = () => {
      router.push("/plantillas-wa")
    }

    const handleSecondaryAction = (event: CustomEvent) => {
      if (event.detail.action === "connect-channel") {
        handleConnectChannel()
      } else if (event.detail.action === "templates") {
        handleTemplates()
      }
    }

    window.addEventListener("global-header-secondary-action", handleSecondaryAction as EventListener)

    return () => {
      window.removeEventListener("global-header-secondary-action", handleSecondaryAction as EventListener)
    }
  }, [router])

  useEffect(() => {
    if (chatIdFromUrl && chatIdFromUrl !== selectedConversation) {
      setSelectedConversation(chatIdFromUrl)
      // Find the account for this conversation
      const conversation = conversations.find((c) => c.id === chatIdFromUrl)
      if (conversation) {
        setSelectedAccount(conversation.accountId)
      }
    }
  }, [chatIdFromUrl, selectedConversation])

  const [chatStates, setChatStates] = useState<Record<string, Conversation>>({
    conv1: { id: "conv1", stage: "nuevo", priority: "alta", assigneeId: "me", unread: 1, archived: false },
    conv2: { id: "conv2", stage: "demo", priority: "hot", assigneeId: "v1", unread: 0, archived: false },
    conv3: { id: "conv3", stage: "calificado", priority: "media", assigneeId: "v2", unread: 1, archived: false },
  })

  const updateChatState = (chatId: string, updates: Partial<Conversation>) => {
    setChatStates((prev) => ({
      ...prev,
      [chatId]: { ...prev[chatId], id: chatId, ...updates },
    }))
  }

  const handleChangeStage = (chatId: string) => (stage: "nuevo" | "calificado" | "demo" | "cierre") => {
    updateChatState(chatId, { stage })
  }

  const handleChangePriority = (chatId: string) => (priority: "baja" | "media" | "alta" | "hot") => {
    updateChatState(chatId, { priority })
  }

  const handleChangeAssignee = (chatId: string) => (assigneeId: string) => {
    updateChatState(chatId, { assigneeId })
  }

  const handleMarkRead = (chatId: string) => () => {
    updateChatState(chatId, { unread: 0 })
  }

  const handleToggleArchive = (chatId: string) => () => {
    const currentState = chatStates[chatId]
    updateChatState(chatId, { archived: !currentState?.archived })
  }

  const aiSuggestions = ["Enviar plan Pro", "Agendar demo hoy 11:00", "Pedir datos de facturación"]

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
    addToast({
      type: "info",
      title: "Sugerencia IA aplicada",
      description: `"${suggestion}" agregado al mensaje`,
    })
  }

  const handleConnectChannel = () => {
    setWizardOpen(true)
  }

  const handleImportTemplates = () => {
    addToast({
      type: "success",
      title: "Plantillas importadas",
      description: "15 plantillas agregadas correctamente",
    })
  }

  const handleNewChat = () => {
    addToast({
      type: "success",
      title: "Nuevo chat iniciado",
      description: "Chat creado correctamente",
    })
  }

  const handleOpenTemplates = () => {
    router.push("/plantillas-wa")
  }

  const getFilteredConversations = () => {
    if (activeFilter === "todos") {
      return conversations
    }
    if (activeFilter === "no-leidos") {
      return conversations.filter((c) => c.unread)
    }
    const platformAccounts = accounts.filter((account) => account.platform === activeFilter)
    const platformAccountIds = platformAccounts.map((account) => account.id)
    return conversations.filter((c) => platformAccountIds.includes(c.accountId))
  }

  const getFilteredAccounts = () => {
    if (activeFilter === "todos" || activeFilter === "no-leidos") {
      return accounts
    }
    return accounts.filter((account) => account.platform === activeFilter)
  }

  const filteredAccounts = getFilteredAccounts()

  const connectedAccounts = filteredAccounts.filter((account) => account.status === "connected")
  const disconnectedAccounts = filteredAccounts.filter((account) => account.status === "disconnected")

  const getAccountConversations = (accountId: string) => {
    return conversations.filter((c) => c.accountId === accountId)
  }

  const filterButtons = [
    { key: "todos", label: "TODOS", icon: <div className="w-3 h-3 bg-gray-500 rounded-full" /> },
    { key: "no-leidos", label: "NO LEÍDOS", icon: <div className="w-3 h-3 bg-blue-500 rounded-full" /> },
    { key: "whatsapp", label: "WHATSAPP", icon: getChannelIcon("whatsapp") },
    { key: "instagram", label: "INSTAGRAM", icon: getChannelIcon("instagram") },
    { key: "facebook", label: "FACEBOOK", icon: getChannelIcon("facebook") },
    { key: "linkedin", label: "LINKEDIN", icon: getChannelIcon("linkedin") },
    { key: "telegram", label: "TELEGRAM", icon: getChannelIcon("telegram") },
    { key: "web", label: "WEB", icon: getChannelIcon("web") },
    { key: "mail", label: "MAIL", icon: getChannelIcon("mail") },
  ]

  const handleConversationClick = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (conversation) {
      setSelectedAccount(conversation.accountId)
      setSelectedConversation(conversationId)
      router.replace(`/chats?chat=${conversationId}`, { scroll: false })
    }
  }

  const handleBackToConversations = () => {
    setSelectedConversation(null)
    setIsContactInfoOpen(false)
    router.replace("/chats", { scroll: false })
  }

  const handleBackToAccounts = () => {
    setSelectedAccount(null)
    setSelectedConversation(null)
    setIsContactInfoOpen(false)
    router.replace("/chats", { scroll: false })
  }

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full">
        {/* Grid principal con menú de cuentas y contenido */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
          {/* Left Panel: Accounts */}
          <div className="border-r border-border bg-card flex flex-col overflow-hidden">
            <div className="p-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filterButtons.map((button) => (
                  <Button
                    key={button.key}
                    variant={activeFilter === button.key ? "default" : "outline"}
                    size="sm"
                    className="whitespace-nowrap text-xs gap-1 flex-shrink-0"
                    onClick={() => {
                      setActiveFilter(button.key as any)
                      setSelectedAccount(null)
                      setSelectedConversation(null)
                      router.replace("/chats")
                    }}
                  >
                    {(() => {
                      const Icon = getChannelIcon(button.key)
                      return <Icon className="h-5 w-5" />
                    })()}
                    {button.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4">
                  <SkeletonList count={6} />
                </div>
              ) : (
                <>
                  {connectedAccounts.length > 0 ? (
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Chats conectados</h3>
                      <div className="space-y-1">
                        {connectedAccounts.map((account) => (
                          <Card
                            key={account.id}
                            className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                              selectedAccount === account.id ? "bg-accent border-primary" : ""
                            }`}
                            onClick={() => {
                              setSelectedAccount(account.id)
                              setSelectedConversation(null)
                              router.replace("/chats")
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const Icon = getChannelIcon(account.platform)
                                  return <Icon className="h-4 w-4" />
                                })()}
                                <span className="font-medium text-sm">{account.name}</span>
                              </div>
                              <div className="ml-auto text-xs font-bold text-white bg-blue-600 dark:bg-blue-500 px-2 py-1 rounded-full min-w-[20px] text-center">
                                {account.conversationsCount}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <EmptyState
                        icon={getChannelIcon("whatsapp")}
                        title="No hay chats conectados"
                        description="Conecta tu primer canal para comenzar a recibir mensajes"
                        action={{
                          label: "Conectar WhatsApp",
                          onClick: handleConnectChannel,
                        }}
                      />
                    </div>
                  )}

                  {disconnectedAccounts.length > 0 && (
                    <div className="p-4 border-t border-border">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Chats desconectados</h3>
                      <div className="space-y-1">
                        {disconnectedAccounts.map((account) => (
                          <Card key={account.id} className="p-3 opacity-60">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const Icon = getChannelIcon(account.platform)
                                  return <Icon className="h-4 w-4" />
                                })()}
                                <span className="font-medium text-sm">{account.name}</span>
                              </div>
                              <div className="ml-auto text-xs font-bold text-white bg-blue-600 dark:bg-blue-500 px-2 py-1 rounded-full min-w-[20px] text-center">
                                {account.conversationsCount}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={handleConnectChannel}>
                      <div className="w-4 h-4 bg-green-500 rounded-full" />
                      +Connect chat
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 bg-background flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" onClick={handleBackToConversations}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {conversations
                            .find((c) => c.id === selectedConversation)
                            ?.contactName.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {conversations.find((c) => c.id === selectedConversation)?.contactName}
                          </h3>
                          <LeadScoreBadge
                            score={conversations.find((c) => c.id === selectedConversation)?.leadScore || 0}
                            className="cursor-help"
                            title={`Lead Score: ${conversations.find((c) => c.id === selectedConversation)?.leadScore}/100 - Basado en intención, recencia y canal`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">En línea</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChatCreateTaskButton
                        chatId={selectedConversation}
                        contactName={conversations.find((c) => c.id === selectedConversation)?.contactName || ""}
                      />
                      <Button variant="ghost" size="sm" onClick={() => setIsContactInfoOpen(!isContactInfoOpen)}>
                        <User className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <ChatQuickBar
                  chatId={selectedConversation}
                  value={chatStates[selectedConversation] || { unread: 0, archived: false }}
                  team={[
                    { id: "me", name: "Luigi Ciarbis", role: "Owner" },
                    { id: "v1", name: "Julieta Vendedora", role: "Vendedor" },
                    { id: "v2", name: "Pablo Vendedor", role: "Vendedor" },
                    { id: "sup", name: "Claudia Supervisor", role: "Supervisor" },
                  ]}
                  onChangeStage={(stage) => handleChangeStage(selectedConversation)(stage)}
                  onChangePriority={(priority) => handleChangePriority(selectedConversation)(priority)}
                  onChangeAssignee={(assigneeId) => handleChangeAssignee(selectedConversation)(assigneeId)}
                  onMarkRead={handleMarkRead(selectedConversation)}
                  onToggleArchive={handleToggleArchive(selectedConversation)}
                />

                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="ai" size="sm" icon>
                      IA
                    </Badge>
                    <span className="text-xs text-muted-foreground">Sugerencias inteligentes:</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {aiSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1 bg-transparent"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Badge variant="ai" size="sm">
                          IA
                        </Badge>
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg max-w-xs">
                        <p className="text-sm">
                          {conversations.find((c) => c.id === selectedConversation)?.lastMessage}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {conversations.find((c) => c.id === selectedConversation)?.timestamp}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs relative">
                        <p className="text-sm">¡Perfecto! Te ayudo con toda la información que necesites</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">14:31</span>
                          <Badge variant="ai" size="sm">
                            IA
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-border bg-card sticky bottom-0 md:relative">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          addToast({
                            title: "Archivo adjunto",
                            description: `${file.name} listo para enviar`,
                          })
                        }
                      }}
                    />
                    <Button variant="ghost" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Input
                      placeholder="Escribe un mensaje..."
                      className="flex-1"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          if (message.trim()) {
                            addToast({
                              title: "Mensaje enviado",
                              description: message,
                            })
                            setMessage("")
                          }
                        }
                      }}
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        addToast({
                          title: "Selector de emoji",
                          description: "Funcionalidad de emoji picker próximamente",
                        })
                      }}
                    >
                      <Smile className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        if (message.trim()) {
                          addToast({
                            title: "Mensaje enviado",
                            description: message,
                          })
                          setMessage("")
                        }
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : selectedAccount ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
                  <Button variant="ghost" size="sm" onClick={handleBackToAccounts}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {(() => {
                    const account = accounts.find((a) => a.id === selectedAccount)
                    if (!account) return null
                    const Icon = getChannelIcon(account.platform)
                    return <Icon className="h-5 w-5" />
                  })()}
                  <h3 className="font-medium">{accounts.find((a) => a.id === selectedAccount)?.name}</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  {isLoading ? (
                    <SkeletonList count={8} />
                  ) : getAccountConversations(selectedAccount).length > 0 ? (
                    <div className="space-y-2">
                      {getAccountConversations(selectedAccount).map((conversation) => {
                        const account = accounts.find((a) => a.id === conversation.accountId)
                        return (
                          <Card
                            key={conversation.id}
                            className="p-3 cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => handleConversationClick(conversation.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {account &&
                                  (() => {
                                    const Icon = getChannelIcon(account.platform)
                                    return <Icon className="h-4 w-4" />
                                  })()}
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {conversation.contactName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">{conversation.contactName}</span>
                                    {conversation.leadScore && (
                                      <LeadScoreBadge
                                        score={conversation.leadScore}
                                        className="cursor-help"
                                        title={`Lead Score: ${conversation.leadScore}/100`}
                                      />
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
                                <p className="text-xs text-muted-foreground/70">{account?.name}</p>
                              </div>
                              {conversation.unread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={getChannelIcon("whatsapp")}
                      title="No hay conversaciones"
                      description="Esta cuenta no tiene conversaciones activas"
                    />
                  )}
                </div>
              </div>
            ) : shouldShowAllConversations ? (
              <>
                <div className="p-4 border-b border-border bg-card">
                  <h3 className="font-medium">
                    {activeFilter === "todos" ? "Todas las conversaciones" : "Conversaciones no leídas"}
                  </h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  {isLoading ? (
                    <SkeletonList count={8} />
                  ) : getFilteredConversations().length > 0 ? (
                    <div className="space-y-2">
                      {getFilteredConversations().map((conversation) => {
                        const account = accounts.find((a) => a.id === conversation.accountId)
                        return (
                          <Card
                            key={conversation.id}
                            className="p-3 cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => handleConversationClick(conversation.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {account &&
                                  (() => {
                                    const Icon = getChannelIcon(account.platform)
                                    return <Icon className="h-4 w-4" />
                                  })()}
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {conversation.contactName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">{conversation.contactName}</span>
                                    {conversation.leadScore && (
                                      <LeadScoreBadge
                                        score={conversation.leadScore}
                                        className="cursor-help"
                                        title={`Lead Score: ${conversation.leadScore}/100`}
                                      />
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
                                <p className="text-xs text-muted-foreground/70">{account?.name}</p>
                              </div>
                              {conversation.unread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={getChannelIcon("whatsapp")}
                      title="No hay conversaciones"
                      description="No se encontraron conversaciones para este filtro"
                      action={{
                        label: "Conectar canal",
                        onClick: handleConnectChannel,
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <EmptyState
                  icon={getChannelIcon("whatsapp")}
                  title="Selecciona una cuenta"
                  description="Elige una cuenta de la lista para ver sus conversaciones"
                />
              </div>
            )}
          </div>

          {/* Right Panel: Contact Info */}
          {isContactInfoOpen && selectedConversation && (
            <div className="w-80 border-l border-border bg-card">
              <ContactInfoPanel
                contactId={conversations.find((c) => c.id === selectedConversation)?.contactId || ""}
                conversationId={selectedConversation}
                onClose={() => setIsContactInfoOpen(false)}
              />
            </div>
          )}
        </div>

        <WizardConnectChannel open={wizardOpen} onOpenChange={setWizardOpen} />
      </div>
    </SidebarLayout>
  )
}
