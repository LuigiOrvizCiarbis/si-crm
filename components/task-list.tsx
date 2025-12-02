"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, Phone, Mail, MessageSquare, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Task {
  id: string
  title: string
  description: string
  priority: "alta" | "media" | "baja"
  status: "pendiente" | "en_progreso" | "completada"
  dueDate: string
  assignedTo: string
  leadName: string
  leadCompany: string
  taskType: "llamada" | "email" | "reunion" | "seguimiento"
  completed: boolean
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Llamada de seguimiento",
    description: "Contactar para agendar demo del producto",
    priority: "alta",
    status: "pendiente",
    dueDate: "2024-01-15",
    assignedTo: "Juan Pérez",
    leadName: "María González",
    leadCompany: "Tech Solutions",
    taskType: "llamada",
    completed: false,
  },
  {
    id: "2",
    title: "Enviar propuesta comercial",
    description: "Preparar y enviar cotización personalizada",
    priority: "alta",
    status: "en_progreso",
    dueDate: "2024-01-16",
    assignedTo: "Ana López",
    leadName: "Carlos Rodríguez",
    leadCompany: "Innovate Corp",
    taskType: "email",
    completed: false,
  },
  {
    id: "3",
    title: "Reunión de cierre",
    description: "Presentación final y negociación de contrato",
    priority: "media",
    status: "pendiente",
    dueDate: "2024-01-18",
    assignedTo: "Roberto Silva",
    leadName: "Diego Morales",
    leadCompany: "Retail Group",
    taskType: "reunion",
    completed: false,
  },
  {
    id: "4",
    title: "Seguimiento post-demo",
    description: "Verificar interés y resolver dudas técnicas",
    priority: "media",
    status: "completada",
    dueDate: "2024-01-14",
    assignedTo: "Laura Fernández",
    leadName: "Patricia López",
    leadCompany: "Global Services",
    taskType: "seguimiento",
    completed: true,
  },
  {
    id: "5",
    title: "Llamada de calificación",
    description: "Evaluar fit del producto con necesidades del cliente",
    priority: "baja",
    status: "pendiente",
    dueDate: "2024-01-20",
    assignedTo: "Juan Pérez",
    leadName: "Ana Martínez",
    leadCompany: "Digital Agency",
    taskType: "llamada",
    completed: false,
  },
]

function getTaskTypeIcon(type: string) {
  switch (type) {
    case "llamada":
      return <Phone className="w-4 h-4" />
    case "email":
      return <Mail className="w-4 h-4" />
    case "reunion":
      return <Calendar className="w-4 h-4" />
    case "seguimiento":
      return <MessageSquare className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "alta":
      return "bg-red-500"
    case "media":
      return "bg-yellow-500"
    case "baja":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pendiente":
      return <Badge variant="secondary">Pendiente</Badge>
    case "en_progreso":
      return <Badge variant="default">En Progreso</Badge>
    case "completada":
      return (
        <Badge variant="outline" className="text-green-600">
          Completada
        </Badge>
      )
    default:
      return <Badge variant="secondary">Pendiente</Badge>
  }
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date()
}

function getPriorityBackgroundColor(priority: string) {
  switch (priority) {
    case "alta":
      return "bg-red-100 dark:bg-[#131722] border-red-200 dark:border-gray-700"
    case "media":
      return "bg-orange-100 dark:bg-[#131722] border-orange-200 dark:border-gray-700"
    case "baja":
      return "bg-green-100 dark:bg-[#131722] border-green-200 dark:border-gray-700"
    default:
      return "bg-gray-100 dark:bg-[#131722] border-gray-200 dark:border-gray-700"
  }
}

function getPriorityTextColor(priority: string) {
  switch (priority) {
    case "alta":
      return "text-red-600 dark:text-red-400"
    case "media":
      return "text-orange-600 dark:text-orange-400"
    case "baja":
      return "text-green-600 dark:text-green-400"
    default:
      return "text-gray-600 dark:text-gray-400"
  }
}

export function TaskList() {
  const [taskList, setTaskList] = useState(tasks)

  const toggleTaskCompletion = (taskId: string) => {
    setTaskList((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed, status: !task.completed ? "completada" : "pendiente" }
          : task,
      ),
    )
  }

  const pendingTasks = taskList.filter((task) => !task.completed)
  const completedTasks = taskList.filter((task) => task.completed)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Tareas Pendientes ({pendingTasks.length})</h3>
        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <Card
              key={task.id}
              className={`${getPriorityBackgroundColor(task.priority)} ${isOverdue(task.dueDate) ? "border-red-200 bg-red-300 dark:bg-red-950/20" : ""}`}
            >
              <CardContent className="p-2 h-10 flex items-center">
                <div className="flex items-center gap-3 w-full">
                  <Checkbox checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id)} />
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getTaskTypeIcon(task.taskType)}
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{task.title}</h4>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`} />
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-900 dark:text-gray-100">{task.leadName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span
                          className={`${getPriorityTextColor(task.priority)} ${isOverdue(task.dueDate) ? "text-red-600 font-medium dark:text-red-400" : ""}`}
                        >
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      {getStatusBadge(task.status)}
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {task.assignedTo
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Duplicar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {completedTasks.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Tareas Completadas ({completedTasks.length})</h3>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <Card key={task.id} className="opacity-60 bg-muted/30 dark:bg-[#131722]">
                <CardContent className="p-2 h-10 flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <Checkbox checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id)} />
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTaskTypeIcon(task.taskType)}
                        <h4 className="font-medium text-sm line-through truncate">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(task.status)}
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {task.assignedTo
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
