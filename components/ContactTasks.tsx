"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, CheckCircle2, Clock } from "lucide-react"
import { allTasks } from "@/lib/data/tasks"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ContactTasksProps {
  contactId: string
  contactName: string
}

export function ContactTasks({ contactId, contactName }: ContactTasksProps) {
  const tasks = allTasks.filter((task) => task.relatedTo?.kind === "contact" && task.relatedTo?.id === contactId)

  const pendingTasks = tasks.filter((t) => t.status !== "hecho" && t.status !== "cancelado")
  const completedTasks = tasks.filter((t) => t.status === "hecho")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Tareas relacionadas</h3>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva tarea
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No hay tareas relacionadas con este contacto</p>
          <Button size="sm" variant="outline" className="mt-3 gap-2 bg-transparent">
            <Plus className="w-4 h-4" />
            Crear primera tarea
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {pendingTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendientes ({pendingTasks.length})
              </h4>
              {pendingTasks.map((task) => (
                <Card key={task.id} className="p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{task.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                        {task.deadline && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(task.deadline), "dd/MM/yyyy", { locale: es })}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">• {task.assignee}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      Ver
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completadas ({completedTasks.length})
              </h4>
              {completedTasks.map((task) => (
                <Card key={task.id} className="p-3 bg-muted/20">
                  <div className="flex items-start justify-between opacity-60">
                    <div className="flex-1">
                      <p className="font-medium text-foreground line-through">{task.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {task.completedAt && format(new Date(task.completedAt), "dd/MM/yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
