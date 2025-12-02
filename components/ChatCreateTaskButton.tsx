"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface ChatCreateTaskButtonProps {
  chatId: string
  contactName: string
}

export function ChatCreateTaskButton({ chatId, contactName }: ChatCreateTaskButtonProps) {
  const handleCreateTask = () => {
    // Mock creation
    toast.success(`Tarea creada y vinculada a ${contactName}`)
  }

  return (
    <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={handleCreateTask}>
      <Plus className="w-4 h-4" />
      Crear tarea
    </Button>
  )
}
