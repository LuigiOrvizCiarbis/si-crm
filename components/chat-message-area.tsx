"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, Instagram } from "lucide-react"

interface Message {
  id: string
  content: string
  timestamp: string
  isFromContact: boolean
  status?: "sent" | "delivered" | "read"
}

const messages: Message[] = [
  {
    id: "1",
    content: "Hola! Vi su publicación sobre marketing digital y me interesa mucho conocer más sobre sus servicios.",
    timestamp: "10:25",
    isFromContact: true,
  },
  {
    id: "2",
    content:
      "¡Hola María! Muchas gracias por contactarnos. Me alegra saber de tu interés. ¿Podrías contarme un poco más sobre tu negocio?",
    timestamp: "10:27",
    isFromContact: false,
    status: "read",
  },
  {
    id: "3",
    content:
      "Claro! Tengo una tienda online de ropa femenina. Llevo 2 años pero siento que no estoy llegando a suficientes clientes potenciales.",
    timestamp: "10:30",
    isFromContact: true,
  },
  {
    id: "4",
    content:
      "Perfecto, entiendo tu situación. Trabajamos mucho con e-commerce de moda. ¿Te parece si agendamos una llamada de 15 minutos para conocer mejor tus objetivos?",
    timestamp: "10:32",
    isFromContact: false,
    status: "delivered",
  },
]

export function ChatMessageArea() {
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Aquí iría la lógica para enviar el mensaje
      setNewMessage("")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>MG</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <Instagram className="w-4 h-4 text-pink-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold">María González</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Instagram
                </Badge>
                <span className="text-xs text-muted-foreground">Activa hace 2 min</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isFromContact ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isFromContact ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs opacity-70">{message.timestamp}</span>
                {!message.isFromContact && message.status && (
                  <div className="text-xs opacity-70">
                    {message.status === "sent" && "✓"}
                    {message.status === "delivered" && "✓✓"}
                    {message.status === "read" && "✓✓"}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="pr-10"
            />
            <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
