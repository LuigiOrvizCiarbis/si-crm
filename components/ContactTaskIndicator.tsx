"use client"

import { CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { mockTasks } from "@/lib/data/tasks"

interface ContactTaskIndicatorProps {
  contactId: string
  className?: string
}

export function ContactTaskIndicator({ contactId, className }: ContactTaskIndicatorProps) {
  // Filter tasks related to this contact
  const contactTasks = mockTasks.filter(
    (task) => task.relatedTo?.type === "contact" && task.relatedTo?.id === contactId,
  )

  const pendingTasks = contactTasks.filter((task) => task.status !== "done")
  const overdueTasks = pendingTasks.filter((task) => {
    if (!task.deadline) return false
    return new Date(task.deadline) < new Date()
  })
  const todayTasks = pendingTasks.filter((task) => {
    if (!task.deadline) return false
    const today = new Date()
    const deadline = new Date(task.deadline)
    return deadline.toDateString() === today.toDateString()
  })

  if (contactTasks.length === 0) return null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {overdueTasks.length > 0 && (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {overdueTasks.length} vencida{overdueTasks.length > 1 ? "s" : ""}
        </Badge>
      )}

      {todayTasks.length > 0 && (
        <Badge variant="default" className="gap-1 bg-orange-500 hover:bg-orange-600">
          <Clock className="h-3 w-3" />
          {todayTasks.length} hoy
        </Badge>
      )}

      {pendingTasks.length > 0 && overdueTasks.length === 0 && todayTasks.length === 0 && (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {pendingTasks.length} pendiente{pendingTasks.length > 1 ? "s" : ""}
        </Badge>
      )}

      {pendingTasks.length === 0 && contactTasks.length > 0 && (
        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Todas completas
        </Badge>
      )}
    </div>
  )
}
