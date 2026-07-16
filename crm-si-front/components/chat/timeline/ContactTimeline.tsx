"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, ListTodo, CalendarClock } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useAuthStore } from "@/store/useAuthStore"
import { getContactTimeline, type TimelineEvent as TimelineEventData, type TimelineEventType } from "@/lib/api/timeline"
import { NewTaskModal } from "@/components/tasks/NewTaskModal"
import { TimelineEvent } from "./TimelineEvent"
import { AddNoteForm } from "./AddNoteForm"

interface ContactTimelineProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: number
  conversationId?: number
  contactName: string
}

type FilterValue = "all" | TimelineEventType

function dayKey(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

export function ContactTimeline({
  open,
  onOpenChange,
  contactId,
  conversationId,
  contactName,
}: ContactTimelineProps) {
  const { t } = useTranslation()
  const currentUser = useAuthStore((state) => state.user)
  const [events, setEvents] = useState<TimelineEventData[]>([])
  const [taskEvents, setTaskEvents] = useState<TimelineEventData[]>([])
  const [isTimelineLoading, setIsTimelineLoading] = useState(false)
  const [areTasksLoading, setAreTasksLoading] = useState(false)
  const [timelineError, setTimelineError] = useState<string | null>(null)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterValue>("all")
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)

  const loadTimeline = useCallback(() => {
    if (!contactId) return
    setIsTimelineLoading(true)
    setTimelineError(null)
    const types = filter === "all" ? undefined : [filter]
    getContactTimeline(contactId, types)
      .then(setEvents)
      .catch((error: unknown) => {
        setEvents([])
        setTimelineError(error instanceof Error ? error.message : t("chats.unknownError"))
      })
      .finally(() => setIsTimelineLoading(false))
  }, [contactId, filter, t])

  const loadTasks = useCallback(() => {
    if (!contactId) return
    setAreTasksLoading(true)
    setTasksError(null)
    getContactTimeline(contactId, ["task"])
      .then(setTaskEvents)
      .catch((error: unknown) => {
        setTaskEvents([])
        setTasksError(error instanceof Error ? error.message : t("chats.unknownError"))
      })
      .finally(() => setAreTasksLoading(false))
  }, [contactId, t])

  useEffect(() => {
    if (open) loadTimeline()
  }, [open, loadTimeline])

  useEffect(() => {
    if (open) loadTasks()
  }, [open, loadTasks])

  const groupedTimeline = useMemo(() => groupByDay(events), [events])
  const groupedTasks = useMemo(() => groupByDay(taskEvents), [taskEvents])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>{t("timeline.title")} · {contactName}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-3 flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="timeline">{t("timeline.title")}</TabsTrigger>
              <TabsTrigger value="tasks">{t("timeline.tasks")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="timeline" className="flex-1 flex flex-col min-h-0 m-0">
            <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-border">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowNoteForm((v) => !v)}>
                <Plus className="w-4 h-4" />
                {t("timeline.addNote")}
              </Button>
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("timeline.allEvents")}</SelectItem>
                  <SelectItem value="note">{t("timeline.note")}</SelectItem>
                  <SelectItem value="task">{t("timeline.task")}</SelectItem>
                  <SelectItem value="message">{t("timeline.message")}</SelectItem>
                  <SelectItem value="stage">{t("timeline.stageChange")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showNoteForm && (
              <div className="px-4 py-3 border-b border-border">
                <AddNoteForm
                  contactId={contactId}
                  conversationId={conversationId}
                  onCreated={() => {
                    setShowNoteForm(false)
                    loadTimeline()
                  }}
                />
              </div>
            )}

            <ScrollArea className="flex-1">
              <TimelineList
                grouped={groupedTimeline}
                isLoading={isTimelineLoading}
                error={timelineError}
                emptyText={t("timeline.empty")}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 flex flex-col min-h-0 m-0">
            <div className="px-4 py-3 flex justify-end gap-2 border-b border-border">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setMeetingModalOpen(true)}>
                <CalendarClock className="w-4 h-4" />
                {t("chats.scheduleMeeting")}
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setTaskModalOpen(true)}>
                <ListTodo className="w-4 h-4" />
                {t("chats.createTask")}
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <TimelineList
                grouped={groupedTasks}
                isLoading={areTasksLoading}
                error={tasksError}
                emptyText={t("timeline.noTasks")}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <NewTaskModal
          open={taskModalOpen}
          onOpenChange={setTaskModalOpen}
          onCreateTask={() => {
            loadTasks()
            if (filter === "all" || filter === "task") loadTimeline()
          }}
          prefilledData={{
            relationType: conversationId ? "chat" : "contact",
            relationId: String(conversationId ?? contactId),
            relationLabel: contactName,
            lockRelation: true,
            ...(currentUser ? { assigneeId: String(currentUser.id) } : {}),
          }}
        />

        <NewTaskModal
          open={meetingModalOpen}
          onOpenChange={setMeetingModalOpen}
          onCreateTask={() => {
            loadTasks()
            if (filter === "all" || filter === "task") loadTimeline()
          }}
          prefilledData={{
            type: "reunion",
            relationType: "contact",
            relationId: String(contactId),
            relationLabel: contactName,
            lockRelation: true,
            ...(currentUser ? { assigneeId: String(currentUser.id) } : {}),
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

function groupByDay(events: TimelineEventData[]): Array<[string, TimelineEventData[]]> {
  const map = new Map<string, TimelineEventData[]>()
  for (const event of events) {
    const key = dayKey(event.occurredAt)
    const bucket = map.get(key) ?? []
    bucket.push(event)
    map.set(key, bucket)
  }
  return Array.from(map.entries())
}

function TimelineList({
  grouped,
  isLoading,
  error,
  emptyText,
}: {
  grouped: Array<[string, TimelineEventData[]]>
  isLoading: boolean
  error: string | null
  emptyText: string
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive text-center py-16 px-4">{error}</p>
  }

  if (grouped.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-16">{emptyText}</p>
  }

  return (
    <div className="p-4 space-y-6">
      {grouped.map(([day, dayEvents]) => (
        <div key={day} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</p>
          <div className="space-y-3">
            {dayEvents.map((event) => (
              <TimelineEvent key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
