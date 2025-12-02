import type { Task } from "@/lib/types/task"
import { leadsData } from "@/lib/data"

// Generate 50 tasks with variety and real references
export const tasksData: Task[] = [
  // Reuniones
  {
    id: "task-1",
    name: "Reunión inicial con María González",
    status: "hecho",
    priority: "alta",
    type: "reunion",
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: "Martín",
    relatedTo: { kind: "contact", id: "lead-1", label: "María González - Tech Solutions SA" },
    reminders: [],
    recurrence: undefined,
    dependsOn: [],
    checklist: [
      { id: "c1", text: "Preparar presentación", done: true },
      { id: "c2", text: "Enviar agenda previa", done: true },
    ],
    attachments: [],
    description: "Primera reunión para entender necesidades de marketing digital",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    syncedCalendars: ["google"],
  },
  {
    id: "task-2",
    name: "Demo de plataforma CRM con Carlos Pérez",
    status: "en-curso",
    priority: "critica",
    type: "demo",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: "Valeria",
    relatedTo: { kind: "pipeline", id: "lead-2", label: "Carlos Pérez - StartupIO" },
    reminders: [
      { at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), channel: "inapp" },
      { at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), channel: "email" },
    ],
    recurrence: undefined,
    dependsOn: [],
    checklist: [
      { id: "c3", text: "Configurar entorno demo", done: true },
      { id: "c4", text: "Preparar casos de uso", done: false },
      { id: "c5", text: "Enviar link de Zoom", done: true },
    ],
    attachments: [{ id: "a1", name: "Propuesta_StartupIO.pdf", url: "#" }],
    description: "Demo completa de funcionalidades de automatización y reportes",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    syncedCalendars: ["google", "outlook"],
  },
  {
    id: "task-3",
    name: "Llamado de seguimiento Ana Martín",
    status: "nuevo",
    priority: "alta",
    type: "llamado",
    deadline: new Date(Date.now()).toISOString(),
    assignee: "Valeria",
    relatedTo: { kind: "contact", id: "lead-3", label: "Ana Martín - Retail Plus" },
    reminders: [{ at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), channel: "inapp" }],
    recurrence: undefined,
    dependsOn: [],
    checklist: [
      { id: "c6", text: "Revisar historial de conversaciones", done: false },
      { id: "c7", text: "Preparar propuesta económica", done: false },
    ],
    attachments: [],
    description: "Seguimiento post-visita al local para cerrar propuesta de PH",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    syncedCalendars: [],
  },
  {
    id: "task-4",
    name: "Enviar propuesta económica - Tech Solutions SA",
    status: "en-espera",
    priority: "media",
    type: "propuesta",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: "Martín",
    relatedTo: { kind: "pipeline", id: "lead-1", label: "María González - Tech Solutions SA" },
    reminders: [],
    recurrence: undefined,
    dependsOn: ["task-1"],
    checklist: [
      { id: "c8", text: "Calcular costos", done: true },
      { id: "c9", text: "Revisar con gerencia", done: false },
      { id: "c10", text: "Redactar propuesta", done: false },
    ],
    attachments: [],
    description: "Propuesta completa incluyendo implementación, capacitación y soporte",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    syncedCalendars: [],
  },
  {
    id: "task-5",
    name: "Visita a oficina - StartupIO",
    status: "reprogramado",
    priority: "media",
    type: "visita",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: "Valeria",
    relatedTo: { kind: "contact", id: "lead-2", label: "Carlos Pérez - StartupIO" },
    reminders: [{ at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), channel: "email" }],
    recurrence: undefined,
    dependsOn: [],
    checklist: [{ id: "c11", text: "Confirmar nueva fecha con Carlos", done: false }],
    attachments: [],
    description: "Visita presencial reprogramada por viaje del cliente",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now()).toISOString(),
    syncedCalendars: [],
  },
  // Agregar más tareas (continuación para llegar a 50)
  {
    id: "task-6",
    name: "Soporte técnico - Implementación módulo contactos",
    status: "en-curso",
    priority: "alta",
    type: "soporte",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: "Lucas",
    relatedTo: undefined,
    reminders: [],
    recurrence: undefined,
    dependsOn: [],
    checklist: [
      { id: "c12", text: "Revisar logs de error", done: true },
      { id: "c13", text: "Aplicar hotfix", done: false },
    ],
    attachments: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now()).toISOString(),
    syncedCalendars: [],
  },
  {
    id: "task-7",
    name: "Seguimiento WhatsApp - Lead Parque Luro",
    status: "nuevo",
    priority: "media",
    type: "seguimiento",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: "Valeria",
    relatedTo: { kind: "chat", id: "conv3", label: "Ana Martín (WhatsApp)" },
    reminders: [{ at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), channel: "push" }],
    recurrence: undefined,
    dependsOn: [],
    checklist: [],
    attachments: [],
    description: "Enviar fotos adicionales de PH y coordinar segunda visita",
    createdAt: new Date(Date.now()).toISOString(),
    updatedAt: new Date(Date.now()).toISOString(),
    syncedCalendars: [],
  },
  // ... (Continue with 43 more tasks to reach 50 total)
  // For brevity, I'll create a function to generate more tasks programmatically
]

// Generate additional tasks programmatically
const generateMoreTasks = (): Task[] => {
  const additionalTasks: Task[] = []
  const statuses: Task["status"][] = ["nuevo", "en-curso", "en-espera", "hecho", "bloqueado"]
  const priorities: Task["priority"][] = ["baja", "media", "alta"]
  const types: Task["type"][] = ["llamado", "seguimiento", "reunion", "demo", "soporte"]
  const assignees = ["Martín", "Valeria", "Lucas", "Sofia"]

  for (let i = 8; i <= 50; i++) {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)]
    const randomType = types[Math.floor(Math.random() * types.length)]
    const randomAssignee = assignees[Math.floor(Math.random() * assignees.length)]
    const daysOffset = Math.floor(Math.random() * 30) - 15 // -15 to +15 days

    additionalTasks.push({
      id: `task-${i}`,
      name: `Tarea ${i}: ${randomType} pendiente`,
      status: randomStatus,
      priority: randomPriority,
      type: randomType,
      deadline: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString(),
      assignee: randomAssignee,
      relatedTo:
        Math.random() > 0.3
          ? {
              kind: "contact",
              id: leadsData[i % leadsData.length]?.id || "lead-1",
              label: leadsData[i % leadsData.length]?.name || "Contacto",
            }
          : undefined,
      reminders: [],
      recurrence: undefined,
      dependsOn: [],
      checklist: [],
      attachments: [],
      description: `Descripción de la tarea ${i}`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now()).toISOString(),
      syncedCalendars: [],
    })
  }

  return additionalTasks
}

// Merge initial tasks with generated ones
export const allTasks = [...tasksData, ...generateMoreTasks()]

export const mockTasks = allTasks

// Helper functions
export const getTasksByStatus = (status: Task["status"]) => {
  return allTasks.filter((task) => task.status === status)
}

export const getTasksByPriority = (priority: Task["priority"]) => {
  return allTasks.filter((task) => task.priority === priority)
}

export const getTasksByType = (type: Task["type"]) => {
  return allTasks.filter((task) => task.type === type)
}

export const getOverdueTasks = () => {
  const now = new Date()
  return allTasks.filter(
    (task) => task.deadline && new Date(task.deadline) < now && task.status !== "hecho" && task.status !== "cancelado",
  )
}

export const getTasksDueToday = () => {
  const today = new Date().toISOString().split("T")[0]
  return allTasks.filter((task) => task.deadline?.startsWith(today) && task.status !== "hecho")
}

export const getTasksDueThisWeek = () => {
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return allTasks.filter((task) => {
    if (!task.deadline || task.status === "hecho" || task.status === "cancelado") return false
    const deadline = new Date(task.deadline)
    return deadline >= now && deadline <= weekFromNow
  })
}

export const getCompletedTasksLast7Days = () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return allTasks.filter(
    (task) => task.status === "hecho" && task.completedAt && new Date(task.completedAt) >= sevenDaysAgo,
  )
}

export const getOnTimePercentage = () => {
  const completedTasks = allTasks.filter((task) => task.status === "hecho" && task.completedAt && task.deadline)
  if (completedTasks.length === 0) return 0

  const onTimeTasks = completedTasks.filter((task) => {
    const completed = new Date(task.completedAt!)
    const deadline = new Date(task.deadline!)
    return completed <= deadline
  })

  return Math.round((onTimeTasks.length / completedTasks.length) * 100)
}
