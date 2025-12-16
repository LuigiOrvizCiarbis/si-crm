"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificationsBell } from "@/components/notifications-bell"
import { Search, Zap, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface ChatsCompactHeaderProps {
  onNewConversation?: () => void
  onConnectChannel?: () => void
  onTemplates?: () => void
  onSearch?: (query: string) => void
}

export function ChatsCompactHeader({
  onNewConversation,
  onConnectChannel,
  onTemplates,
  onSearch,
}: ChatsCompactHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="h-[75px] px-4 md:px-6 flex items-center gap-3">
        {/* Left: Title only (no subtitle) */}
        <h1 className="text-lg font-semibold tracking-tight shrink-0">Chats</h1>

        {/* Center: Search input (flexible width) */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            className="pl-9 h-9"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        {/* Right: Secondary actions + CTA + Notifications */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Secondary actions - visible on larger screens */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onConnectChannel} className="gap-2 bg-transparent">
              <Zap className="w-4 h-4" />
              Conectar canal
            </Button>
            <Button variant="outline" size="sm" onClick={onTemplates} className="gap-2 bg-transparent">
              <FileText className="w-4 h-4" />
              Plantillas
            </Button>
          </div>

          {/* Overflow menu for medium screens */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onConnectChannel}>
                <Zap className="w-4 h-4 mr-2" />
                Conectar canal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTemplates}>
                <FileText className="w-4 h-4 mr-2" />
                Plantillas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* CTA primary */}
          <Button size="sm" onClick={onNewConversation} className="shrink-0">
            + Nueva conversación
          </Button>

          {/* Notifications bell */}
          <NotificationsBell />
        </div>
      </div>
    </div>
  )
}
