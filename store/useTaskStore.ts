import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Task } from "@/lib/types/task"
import { allTasks as initialTasks } from "@/lib/data/tasks"

interface TaskStore {
  tasks: Task[]
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTasks: () => Task[]
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: initialTasks,

      addTask: (task: Task) => {
        set((state) => ({
          tasks: [...state.tasks, task],
        }))
      },

      updateTask: (id: string, updates: Partial<Task>) => {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
        }))
      },

      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },

      getTasks: () => get().tasks,
    }),
    {
      name: "social-impulse-tasks",
      partialize: (state) => ({
        tasks: state.tasks,
      }),
    },
  ),
)
