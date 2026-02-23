"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/Toast"
import { MailOpen, Archive, Settings, Loader2 } from "lucide-react"
import { getPipelineStages, PipelineStage } from "@/lib/api/pipeline"
import { getUsers } from "@/lib/api/users"
import { updateConversationStage, assignConversationUser } from "@/lib/api/conversations"
import { useTranslation } from "@/hooks/useTranslation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Types
type Priority = "baja" | "media" | "alta" | "hot"

interface TeamUser {
  id: number
  name: string
  role: "Vendedor" | "Supervisor" | "Owner"
}

interface ChatQuickBarValue {
  stageId?: number // Cambiado de stage: Stage a stageId: number
  priority?: Priority
  assigneeId?: number | string
  unread?: boolean
  archived?: boolean
}

interface ChatQuickBarProps {
  chatId: number
  value: ChatQuickBarValue
  team: TeamUser[]
  onChangeStage: (stageId: number, stageName: string) => void // Ajustado para recibir ID y nombre
  onChangePriority: (priority: Priority) => void
  onChangeAssignee: (id: number) => void
  onMarkRead: () => void
  onToggleArchive: () => void
}

// Eliminado TEAM fijo: ahora se cargan usuarios reales desde API. Se mantiene posibilidad de pasar prop "team" como override.

export function ChatQuickBar({
  chatId,
  value,
  team = [],
  onChangeStage,
  onChangePriority,
  onChangeAssignee,
  onMarkRead,
  onToggleArchive,
}: ChatQuickBarProps) {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [tempValues, setTempValues] = useState({
    stageId: value.stageId, // Usar stageId
    priority: value.priority || "baja",
    assigneeId: (typeof value.assigneeId === 'number' || typeof value.assigneeId === 'string') ? String(value.assigneeId) : '',
  })

  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [isLoadingStages, setIsLoadingStages] = useState(true)
  const [users, setUsers] = useState<TeamUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  // Helpers de normalización
  const toNumber = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const n = parseInt(v, 10)
      return Number.isFinite(n) ? n : undefined
    }
    return undefined
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stages, fetchedUsers] = await Promise.all([
          getPipelineStages(),
          getUsers(),
        ])
        setPipelineStages(stages)
        setUsers(fetchedUsers.map(u => ({ id: u.id, name: u.name, role: (u.role as TeamUser['role']) || 'Vendedor' })))
        console.log('[ChatQuickBar] users loaded:', fetchedUsers.length)
      } catch (error) {
        console.error('Error loading stages/users', error)
      } finally {
        setIsLoadingStages(false)
        setIsLoadingUsers(false)
      }
    }
    loadData()
  }, [])

  const handleStageChange = (stageId: number) => {
    // Encontrar la etapa por ID
    const stage = pipelineStages.find(s => s.id === stageId);
    console.log("🚀 ~ handleStageChange ~ stage:", stage)
    if (!stage) {
      addToast({
        type: "error",
        title: t("chats.genericError"),
        description: t("chats.stageNotFound"),
      });
      return;
    }

    // Llamar a la API para actualizar (ahora con el ID numérico)
    updateConversationStage(chatId, stageId)
      .then(() => {
        // ✅ IMPORTANTE: Notificar al padre para que actualice su estado
        onChangeStage(stageId, stage.name);

        addToast({
          type: "success",
          title: t("chats.stageUpdated"),
          description: `${t("chats.stageChangedTo")} ${stage.name}`,
        });
      })
      .catch((error) => {
        addToast({
          type: "error",
          title: t("chats.stageUpdateError"),
          description: error.message,
        });
      });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable
      if (isInput) return

      if (e.key === "l" || e.key === "L") {
        e.preventDefault()
        onMarkRead()
        addToast({
          type: "success",
          title: t("chats.chatMarkedRead"),
          description: t("chats.chatMarkedReadDesc"),
        })
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault()
        onToggleArchive()
        addToast({
          type: "success",
          title: value.archived ? t("chats.chatUnarchived") : t("chats.chatArchived"),
          description: value.archived ? t("chats.chatUnarchivedDesc") : t("chats.chatArchivedDesc"),
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onMarkRead, onToggleArchive, value.archived, addToast])

  useEffect(() => {
    setTempValues({
      stageId: value.stageId,
      priority: value.priority || "baja",
      assigneeId: (typeof value.assigneeId === 'number' || typeof value.assigneeId === 'string') ? String(value.assigneeId) : '',
    });
  }, [value.stageId, value.priority, value.assigneeId]);


  const handlePriorityChange = (priority: Priority) => {
    onChangePriority(priority)
    addToast({
      type: "success",
      title: t("chats.priorityUpdated"),
      description: `${t("chats.priorityChangedTo")} ${getPriorityLabel(priority)}`,
    })
  }

  const handleAssigneeChange = async (assigneeId: number) => {
    const effectiveTeam = team.length ? team : users
    const assignee = effectiveTeam.find((t) => t.id === assigneeId)

    console.log("[ChatQuickBar] handleAssigneeChange called with:", assigneeId);

    try {
      // Llamar al backend para guardar
      const response = await assignConversationUser(chatId, assigneeId)
      console.log("[ChatQuickBar] Backend response:", response);

      // Notificar al componente padre
      onChangeAssignee(assigneeId)

      addToast({
        type: "success",
        title: t("chats.chatAssigned"),
        description: `${t("chats.chatAssignedTo")} ${assignee?.name}`,
      })
    } catch (error) {
      console.error("Error asignando usuario:", error)
      addToast({
        type: "error",
        title: t("chats.assignError"),
        description: error instanceof Error ? error.message : t("chats.assignErrorDesc"),
      })
    }
  }

  const handleMarkRead = () => {
    onMarkRead()
    addToast({
      type: "success",
      title: t("chats.chatMarkedRead"),
      description: t("chats.chatMarkedReadDesc"),
    })
  }

  const handleToggleArchive = () => {
    onToggleArchive()
    addToast({
      type: "success",
      title: value.archived ? t("chats.chatUnarchived") : t("chats.chatArchived"),
      description: value.archived ? t("chats.chatUnarchivedDesc") : t("chats.chatArchivedDesc"),
    })
  }

  const handleSaveDrawer = () => {
    if (tempValues.stageId !== value.stageId) {
      handleStageChange(tempValues.stageId as unknown as number);
    }
    if (tempValues.priority !== value.priority) {
      handlePriorityChange(tempValues.priority);
    }
    if (String(tempValues.assigneeId) !== String(value.assigneeId)) {
      const parsed = toNumber(tempValues.assigneeId)
      if (parsed === undefined) {
        addToast({ type: "error", title: t("chats.invalidUser"), description: t("chats.invalidUserDesc") })
      } else {
        handleAssigneeChange(parsed)
      }
    }
    setIsDrawerOpen(false);
  };




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

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case "baja":
        return t("chats.priorityLow")
      case "media":
        return t("chats.priorityMedium")
      case "alta":
        return t("chats.priorityHigh")
      case "hot":
        return t("chats.priorityHot")
      default:
        return t("chats.priorityLow")
    }
  }

  useEffect(() => {
    console.log("ChatQuickBar value:", value);
    console.log("ChatQuickBar value.assigneeId:", value.assigneeId, "type:", typeof value.assigneeId);
    console.log("Pipeline stages:", pipelineStages);
  }, [value, pipelineStages]);

  return (
    // Derivados calculados para selects
    (() => {
      const effectiveTeam = team.length ? team : users
      const desktopFallbackId = effectiveTeam[0]?.id
      const selectedAssigneeId = toNumber(value.assigneeId) ?? desktopFallbackId ?? ''
      const selectedAssigneeName = effectiveTeam.find((m) => String(m.id) === String(selectedAssigneeId))?.name || t("chats.select")
      const selectedStageName = pipelineStages.find((s) => s.id === value.stageId)?.name || t("chats.select")

      console.log("[ChatQuickBar render] value.assigneeId:", value.assigneeId, "selectedAssigneeId:", selectedAssigneeId, "users:", users.length);

      const mobileEffectiveTeam = effectiveTeam
      const mobileFallbackId = mobileEffectiveTeam[0]?.id
      const selectedTempAssigneeId = toNumber(tempValues.assigneeId) ?? mobileFallbackId ?? ''

      return (
    <div className="sticky top-0 z-10 bg-[#0F1117]/80 backdrop-blur rounded-xl border border-[#1e2533] p-2">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-2">
        {/* Stage Select */}
        <div className="inline-flex items-center gap-2 text-[12px] text-[#9AA4B2] bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-1.5">
          <span>{t("chats.stageLabel")}:</span>
          {isLoadingStages ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Select
              key={`${value.stageId}-${pipelineStages.length}`}
              value={value.stageId?.toString() || ""}
              onValueChange={(val) => handleStageChange(Number(val))}
            >
              <SelectTrigger className="h-auto w-[140px] border-0 bg-transparent p-0 text-[#D8DEE9] text-sm focus:ring-0 focus:ring-offset-0 gap-2 hover:bg-transparent data-placeholder:text-[#D8DEE9]">
                <SelectValue placeholder={t("chats.select")} className="truncate">
                  <span className="truncate block w-full text-left">
                    {selectedStageName}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#0F1117] border-[#1e2533] text-[#D8DEE9]">
                {pipelineStages.map((stage) => (
                  <SelectItem 
                    key={stage.id} 
                    value={String(stage.id)}
                    className="focus:bg-[#1A1F2B] focus:text-[#D8DEE9] cursor-pointer"
                  >
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Priority Select */}
        <div className="inline-flex items-center gap-2 text-[12px] text-[#9AA4B2] bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-1.5">
          <span>{t("chats.priorityLabel")}:</span>
          <select
            value={value.priority || "baja"}
            onChange={(e) => handlePriorityChange(e.target.value as Priority)}
            className={`bg-transparent text-sm focus:outline-none ${getPriorityColor(value.priority || "baja")}`}
          >
            <option value="baja">{t("chats.priorityLow")}</option>
            <option value="media">{t("chats.priorityMedium")}</option>
            <option value="alta">{t("chats.priorityHigh")}</option>
            <option value="hot">{t("chats.priorityHot")}</option>
          </select>
        </div>

        {/* Assignee Select (shadcn Select) */}
        <div className="inline-flex items-center gap-2 text-[12px] text-[#9AA4B2] bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-1.5">
          <span>{t("chats.assignToLabel")}:</span>
          {isLoadingUsers ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Select
              value={String(selectedAssigneeId)}
              onValueChange={(val) => handleAssigneeChange(Number(val))}
            >
              <SelectTrigger className="h-auto w-40 border-0 bg-transparent p-0 text-[#D8DEE9] text-sm focus:ring-0 focus:ring-offset-0 gap-2">
                <SelectValue placeholder={t("chats.select")} className="truncate">
                  <span className="truncate block w-full text-left">
                    {selectedAssigneeName}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#0F1117] border-[#1e2533] text-[#D8DEE9] max-h-64 overflow-y-auto">
                {effectiveTeam.map((member) => (
                  <SelectItem key={member.id} value={String(member.id)} className="focus:bg-[#1A1F2B] focus:text-[#D8DEE9] cursor-pointer">
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-[#1e2533] hover:bg-[#1A1F2B] text-[#D8DEE9]"
            onClick={handleMarkRead}
            title={t("chats.markReadShortcut")}
          >
            <MailOpen className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-[#1e2533] hover:bg-[#1A1F2B] text-[#D8DEE9]"
            onClick={handleToggleArchive}
            title={value.archived ? t("chats.unarchiveShortcut") : t("chats.archiveShortcut")}
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex items-center justify-between">
        <div className="text-sm text-[#D8DEE9]">
          <span className="text-[#9AA4B2]">{t("chats.stageLabel")}:</span> {selectedStageName} •
          <span className="text-[#9AA4B2]"> {t("chats.priorityLabel")}:</span>{" "}
          <span className={getPriorityColor(value.priority || "baja")}>
            {getPriorityLabel(value.priority || "baja")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-[#1e2533] hover:bg-[#1A1F2B] text-[#D8DEE9]"
            onClick={handleMarkRead}
            title={t("chats.markReadShortcut")}
          >
            <MailOpen className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-lg border border-[#1e2533] hover:bg-[#1A1F2B] text-[#D8DEE9]"
            onClick={handleToggleArchive}
            title={value.archived ? t("chats.unarchiveShortcut") : t("chats.archiveShortcut")}
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
                {t("chats.manage")}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-[#0F1117] border-[#1e2533]">
              <SheetHeader>
                <SheetTitle className="text-[#D8DEE9]">{t("chats.manageChat")}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                {/* Etapa */}
                <div>
                  <label className="block text-sm font-medium text-[#9AA4B2] mb-2">{t("chats.stageLabel")}</label>
                  <select
                    value={String(tempValues.stageId ?? "")}
                    onChange={(e) => setTempValues((prev) => ({ ...prev, stageId: Number(e.target.value) }))}
                    className="w-full bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-2 text-[#D8DEE9] focus:outline-none focus:border-[#00F7FF]"
                  >
                    {isLoadingStages ? (
                      <option value="">{t("chats.loading")}</option>
                    ) : (
                      pipelineStages.map((stage) => (
                        <option key={stage.id} value={String(stage.id)}>
                          {stage.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-[#9AA4B2] mb-2">{t("chats.priorityLabel")}</label>
                  <select
                    value={tempValues.priority}
                    onChange={(e) => setTempValues((prev) => ({ ...prev, priority: e.target.value as Priority }))}
                    className="w-full bg-[#131722] border border-[#1e2533] rounded-xl px-3 py-2 text-[#D8DEE9] focus:outline-none focus:border-[#00F7FF]"
                  >
                    <option value="baja">{t("chats.priorityLow")}</option>
                    <option value="media">{t("chats.priorityMedium")}</option>
                    <option value="alta">{t("chats.priorityHigh")}</option>
                    <option value="hot">{t("chats.priorityHot")}</option>
                  </select>
                </div>

                {/* Derivar a (shadcn Select) */}
                <div>
                  <label className="block text-sm font-medium text-[#9AA4B2] mb-2">{t("chats.assignToLabel")}</label>
                  {isLoadingUsers ? (
                    <div className="flex items-center gap-2 text-[#9AA4B2] text-sm"><Loader2 className="h-4 w-4 animate-spin" /> {t("chats.loadingUsers")}</div>
                  ) : (
                    <Select
                      value={String(selectedTempAssigneeId)}
                      onValueChange={(val) => setTempValues((prev) => ({ ...prev, assigneeId: val }))}
                    >
                      <SelectTrigger className="w-full h-auto border-[#1e2533] bg-[#131722] text-[#D8DEE9] text-sm focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder={t("chats.selectUser")} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F1117] border-[#1e2533] text-[#D8DEE9] max-h-64 overflow-y-auto">
                        {mobileEffectiveTeam.map((member) => (
                          <SelectItem key={member.id} value={String(member.id)} className="focus:bg-[#1A1F2B] focus:text-[#D8DEE9] cursor-pointer">
                            {member.name} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveDrawer} className="flex-1 bg-[#00F7FF] text-black hover:bg-[#00F7FF]/90">
                    {t("common.save")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTempValues({
                        stageId: value.stageId || 1,
                        priority: value.priority || "baja",
                        assigneeId: (typeof value.assigneeId === 'number' || typeof value.assigneeId === 'string') ? String(value.assigneeId) : '',
                      })
                      setIsDrawerOpen(false)
                    }}
                    className="flex-1 border-[#1e2533] text-[#D8DEE9] hover:bg-[#1A1F2B]"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
      )
    })()
  )
}
