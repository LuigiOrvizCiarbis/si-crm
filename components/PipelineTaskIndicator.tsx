"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckSquare } from "lucide-react"
import { allTasks } from "@/lib/data/tasks"

interface PipelineTaskIndicatorProps {
  pipelineId: string
}

export function PipelineTaskIndicator({ pipelineId }: PipelineTaskIndicatorProps) {
  const tasks = allTasks.filter((task) => task.relatedTo?.kind === "pipeline" && task.relatedTo?.id === pipelineId)

  const pendingTasks = tasks.filter((t) => t.status !== "hecho" && t.status !== "cancelado")

  if (tasks.length === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-primary/10">
            <CheckSquare className="w-3 h-3" />
            {pendingTasks.length}/{tasks.length}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{pendingTasks.length} tarea(s) pendiente(s)</p>
          <p className="text-xs text-muted-foreground">{tasks.length} total</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
