import type { TaskStatus, TaskType } from "@/lib/types/task"

export interface TaskFilters {
  status: TaskStatus[]
  assignees: string[]
  types: TaskType[]
  deadline: "overdue" | "today" | "this-week" | "next-7-days" | "no-date" | null
}
