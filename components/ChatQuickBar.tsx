"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/Toast"
import { MailOpen, Archive, Settings } from "lucide-react"
import type { StageColor } from "@/store/useAppStore"

type Priority = "baja" | "media" | "alta" | "hot"

interface TeamUser {
  id: string
  name: string
  role: "Vendedor" | "Supervisor" | "Owner"
}

interface ChatQuickBarValue {
  stage?: string // Changed to string to support all Pipeline stages
  priority?: Priority
  assigneeId?: string
  unread?: number
  archived?: boolean
}

interface ChatQuickBarProps {
  chatId: string
  value: ChatQuickBarValue
  team: TeamUser[]
  stages: StageColor[] // Added stages prop for Pipeline stages
  getStageColor: (stageId: string) => string // Added getStageColor helper
  onChangeStage: (stage: string) => void // Changed to string
  onChangePriority: (priority: Priority) => void
  onChangeAssignee: (id: string) => void
  onMarkRead: () => void
  onToggleArchive: () => void
}

const TEAM: TeamUser[] = [
  { id: "me", name: "Luigi Ciarbis", role: "Owner" },
  { id: "v1", name: "Julieta Vendedora", role: "Vendedor" },
  { id: "v2", name: "Pablo Vendedor", role: "Vendedor" },
  { id: "sup", name: "Claudia Supervisor", role: "Supervisor" },
]

export function ChatQuickBar({
  chatId,
  value,
  team = TEAM,
  stages,
  getStageColor,
  onChangeStage,
  onChangePriority,
  onChangeAssignee,
  onMarkRead,
  onToggleArchive,
}: ChatQuickBarProps) {
  const { addToast } = useToast()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [tempValues, setTempValues] = useState({
    stage: value.stage || "prospecto",
    priority: value.priority || "baja",
    assigneeId: value.assigneeId || "me",
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "l" || e.key === "L") {
        e.preventDefault()
        onMarkRead()
        addToast({
          type: "success",
          title: "Chat marcado como leído",
          description: "El chat ha sido marcado como leído",
        })
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault()
        onToggleArchive()
        addToast({
          type: "success",
          title: value.archived ? "Chat desarchivado" : "Chat archivado",
          description: value.archived ? "El chat ha sido desarchivado" : "El chat ha sido archivado",
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onMarkRead, onToggleArchive, value.archived, addToast])

  const handleStageChange = (stageId: string) => {
    onChangeStage(stageId)
    const stage = stages.find((s) => s.id === stageId)
    addToast({
      type: "success",
      title: "Etapa actualizada",
      description: `Etapa cambiada a: ${stage?.name || stageId}`,
    })
  }

  const handlePriorityChange = (priority: Priority) => {
    onChangePriority(priority)
    addToast({
      type: "success",
      title: "Prioridad actualizada",
      description: `Prioridad cambiada a: ${priority}`,
    })
  }

  const handleAssigneeChange = (assigneeId: string) => {
    onChangeAssignee(assigneeId)
    const assignee = team.find((t) => t.id === assigneeId)
    addToast({
      type: "success",
      title: "Chat derivado",
      description: `Chat derivado a: ${assignee?.name}`,
    })
  }

  const handleMarkRead = () => {
    onMarkRead()
    addToast({
      type: "success",
      title: "Chat marcado como leído",
      description: "El chat ha sido marcado como leído",
    })
  }

  const handleToggleArchive = () => {
    onToggleArchive()
    addToast({
      type: "success",
      title: value.archived ? "Chat desarchivado" : "Chat archivado",
      description: value.archived ? "El chat ha sido desarchivado" : "El chat ha sido archivado",
    })
  }

  const handleSaveDrawer = () => {
    if (tempValues.stage !== value.stage) {
      handleStageChange(tempValues.stage)
    }
    if (tempValues.priority !== value.priority) {
      handlePriorityChange(tempValues.priority)
    }
    if (tempValues.assigneeId !== value.assigneeId) {
      handleAssigneeChange(tempValues.assigneeId)
    }
    setIsDrawerOpen(false)
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "baja":
        return "text-[#9AA4B2]"
      case "media":
        return "text-[#00E18C]"
      case "alta":
        return "text-[#00F7FF]"
      case "hot":
        return "text-red-500"
      default:
        return "text-[#9AA4B2]"
    }
  }

  const currentStage = stages.find((s) => s.id === value.stage) || stages[0]
  const currentStageColor = getStageColor(value.stage || "prospecto")

  return (
    <div className="sticky top-0 z-10 bg-[#0F1117]/80 backdrop-blur rounded-xl border border-[#1e2533] p-2">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-2">
        {/* Stage Select */}
        <div className="inline-flex items-center gap-2 text-[12px] text-[#9AA4B2] bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-1.5">
          <span>Etapa:</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStageColor }} />
            <select
              value={value.stage || "prospecto"}
              onChange={(e) => handleStageChange(e.target.value)}
              className="bg-transparent text-[#D8DEE9] text-sm focus:outline-none"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority Select */}
        <div className="inline-flex items-center gap-2 text-[12px] text-[#9AA4B2] bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-1.5">
          <span>Prioridad:</span>
          <select
            value={value.priority || "baja"}
            onChange={(e) => handlePriorityChange(e.target.value as Priority)}
            className={`bg-transparent text-sm focus:outline-none ${getPriorityColor(value.priority || "baja")}`}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="hot">Hot</option>
          </select>
        </div>

        {/* Assignee Select */}
        <div className="inline-flex items-center gap-2 text-[12px] text-[#9AA4B2] bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-1.5">
          <span>Derivar a:</span>
          <select
            value={value.assigneeId || "me"}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className="bg-transparent text-[#D8DEE9] text-sm focus:outline-none"
          >
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-[#1e2533] hover:bg-[#1A1F2B] text-[#D8DEE9]"
            onClick={handleMarkRead}
            title="Marcar como leído (L)"
          >
            <MailOpen className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-[#1e2533] hover:bg-[#1A1F2B] text-[#D8DEE9]"
            onClick={handleToggleArchive}
            title={value.archived ? "Desarchivar (E)" : "Archivar (E)"}
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex items-center justify-between">
        <div className="text-sm text-[#D8DEE9] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStageColor }} />
          <span className="text-[#9AA4B2]">Etapa:</span> {currentStage.name} •
          <span className="text-[#9AA4B2]"> Prioridad:</span>{" "}
          <span className={getPriorityColor(value.priority || "baja")}>{value.priority || "baja"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-[#1e2533] hover:bg-[#1A1F2B] text-[#D8DEE9]"
            onClick={handleMarkRead}
            title="Marcar como leído (L)"
          >
            <MailOpen className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-[#1e2533] hover:bg-[#1A1F2B] text-[#D8DEE9]"
            onClick={handleToggleArchive}
            title={value.archived ? "Desarchivar (E)" : "Archivar (E)"}
          >
            <Archive className="w-4 h-4" />
          </Button>

          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-1.5 rounded-xl border border-[#1e2533] bg-white/5 text-sm text-[#D8DEE9]"
              >
                <Settings className="w-4 h-4 mr-1" />
                Gestionar
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-[#0F1117] border-[#1e2533]">
              <SheetHeader>
                <SheetTitle className="text-[#D8DEE9]">Gestionar Chat</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                {/* Etapa */}
                <div>
                  <label className="block text-sm font-medium text-[#9AA4B2] mb-2">Etapa</label>
                  <select
                    value={tempValues.stage}
                    onChange={(e) => setTempValues((prev) => ({ ...prev, stage: e.target.value }))}
                    className="w-full bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-2 text-[#D8DEE9] focus:outline-none focus:border-[#00F7FF]"
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-[#9AA4B2] mb-2">Prioridad</label>
                  <select
                    value={tempValues.priority}
                    onChange={(e) => setTempValues((prev) => ({ ...prev, priority: e.target.value as Priority }))}
                    className="w-full bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-2 text-[#D8DEE9] focus:outline-none focus:border-[#00F7FF]"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>

                {/* Derivar a */}
                <div>
                  <label className="block text-sm font-medium text-[#9AA4B2] mb-2">Derivar a</label>
                  <select
                    value={tempValues.assigneeId}
                    onChange={(e) => setTempValues((prev) => ({ ...prev, assigneeId: e.target.value }))}
                    className="w-full bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-2 text-[#D8DEE9] focus:outline-none focus:border-[#00F7FF]"
                  >
                    {team.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveDrawer} className="flex-1 bg-[#00F7FF] text-black hover:bg-[#00F7FF]/90">
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTempValues({
                        stage: value.stage || "prospecto",
                        priority: value.priority || "baja",
                        assigneeId: value.assigneeId || "me",
                      })
                      setIsDrawerOpen(false)
                    }}
                    className="flex-1 border-[#1e2533] text-[#D8DEE9] hover:bg-[#1A1F2B]"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
