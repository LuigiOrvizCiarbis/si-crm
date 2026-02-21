"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAppStore } from "@/store/useAppStore"
import {
  Home,
  MessageSquare,
  Target,
  CheckSquare,
  BarChart3,
  Settings,
  Plus,
  Zap,
  CreditCard,
  Calendar,
  Search,
} from "lucide-react"
import { useToast } from "./Toast"

export function CommandPalette() {
  const router = useRouter()
  const { addToast } = useToast()
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore()
  const [search, setSearch] = useState("")

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }

      // Global shortcuts
      if (!commandPaletteOpen) {
        const tag = (e.target as HTMLElement)?.tagName
        const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable
        if (isInput) return

        if (e.key === "g" && e.ctrlKey) {
          e.preventDefault()
          return
        }

        if (e.key === "g") {
          const nextKey = new Promise<string>((resolve) => {
            const handler = (e: KeyboardEvent) => {
              document.removeEventListener("keydown", handler)
              resolve(e.key)
            }
            document.addEventListener("keydown", handler)
          })

          nextKey.then((key) => {
            switch (key) {
              case "p":
                router.push("/")
                break
              case "c":
                router.push("/chats")
                break
              case "o":
                router.push("/oportunidades")
                break
            }
          })
        }

        if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          addToast({
            type: "success",
            title: "Nuevo lead creado",
            description: "Lead agregado al pipeline",
          })
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [commandPaletteOpen, setCommandPaletteOpen, router, addToast])

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false)
    command()
  }

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="p-0 max-w-[640px]">
        <Command className="rounded-2xl border-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Buscar acciones..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados.
            </Command.Empty>

            <Command.Group heading="Navegación">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <Home className="w-4 h-4" />
                Panel
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">G P</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/chats"))}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <MessageSquare className="w-4 h-4" />
                Chats
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">G C</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/oportunidades"))}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <Target className="w-4 h-4" />
                Oportunidades
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">G O</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/tareas"))}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <CheckSquare className="w-4 h-4" />
                Tareas
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/metricas"))}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <BarChart3 className="w-4 h-4" />
                Métricas
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/admin"))}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Acciones">
              <Command.Item
                onSelect={() =>
                  runCommand(() => {
                    addToast({
                      type: "success",
                      title: "Nuevo lead creado",
                      description: "Lead agregado al pipeline",
                    })
                  })
                }
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <Plus className="w-4 h-4" />
                Nuevo lead
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">N</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  runCommand(() => {
                    addToast({
                      type: "info",
                      title: "Conectar canal",
                      description: "Abriendo wizard de conexión...",
                    })
                  })
                }
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <Zap className="w-4 h-4" />
                Conectar canal
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  runCommand(() => {
                    addToast({
                      type: "success",
                      title: "Pago registrado",
                      description: "Pago procesado correctamente",
                    })
                  })
                }
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <CreditCard className="w-4 h-4" />
                Registrar pago
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  runCommand(() => {
                    addToast({
                      type: "success",
                      title: "Demo agendada",
                      description: "Demo programada para mañana a las 15:00",
                    })
                  })
                }
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-accent"
              >
                <Calendar className="w-4 h-4" />
                Agendar demo
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
