import type { Contact } from "@/components/contacts-list"

export class SyncManager {
  private static instance: SyncManager

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  syncToPipeline(contactId: string, updates: Partial<Contact>) {
    if (updates.etapaPipeline) {
      // Update pipeline card stage
      const pipelineData = this.getPipelineData()
      const updatedData = pipelineData.map((stage) => ({
        ...stage,
        cards: stage.cards.map((card) =>
          card.contactId === contactId ? { ...card, stage: updates.etapaPipeline! } : card,
        ),
      }))

      // Move card to new stage if etapaPipeline changed
      const cardToMove = pipelineData.flatMap((s) => s.cards).find((c) => c.contactId === contactId)

      if (cardToMove && cardToMove.stage !== updates.etapaPipeline) {
        const newStages = updatedData.map((stage) => ({
          ...stage,
          cards: stage.cards.filter((c) => c.contactId !== contactId),
        }))

        const targetStage = newStages.find((s) => s.id === updates.etapaPipeline)
        if (targetStage) {
          targetStage.cards.push({ ...cardToMove, stage: updates.etapaPipeline })
        }

        this.savePipelineData(newStages)
        console.log("[v0] Synced etapaPipeline to Pipeline:", contactId, updates.etapaPipeline)
      }
    }

    if (updates.vendedor) {
      // Update card owner
      const pipelineData = this.getPipelineData()
      const updatedData = pipelineData.map((stage) => ({
        ...stage,
        cards: stage.cards.map((card) => (card.contactId === contactId ? { ...card, owner: updates.vendedor! } : card)),
      }))
      this.savePipelineData(updatedData)
      console.log("[v0] Synced vendedor to Pipeline:", contactId, updates.vendedor)
    }
  }

  syncToChats(contactId: string, updates: Partial<Contact>) {
    if (updates.vendedor) {
      // Update chat conversation owner
      const chatsData = this.getChatsData()
      const updatedData = chatsData.map((conv) =>
        conv.contactId === contactId ? { ...conv, assignedTo: updates.vendedor! } : conv,
      )
      this.saveChatsData(updatedData)
      console.log("[v0] Synced vendedor to Chats:", contactId, updates.vendedor)
    }

    if (updates.source) {
      // Update chat channel
      const chatsData = this.getChatsData()
      const updatedData = chatsData.map((conv) =>
        conv.contactId === contactId ? { ...conv, channel: updates.source! } : conv,
      )
      this.saveChatsData(updatedData)
      console.log("[v0] Synced source to Chats:", contactId, updates.source)
    }
  }

  syncAll(contactId: string, updates: Partial<Contact>) {
    this.syncToPipeline(contactId, updates)
    this.syncToChats(contactId, updates)
  }

  private getPipelineData(): any[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("pipeline-data")
    return data ? JSON.parse(data) : []
  }

  private savePipelineData(data: any[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem("pipeline-data", JSON.stringify(data))
    }
  }

  private getChatsData(): any[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("chats-data")
    return data ? JSON.parse(data) : []
  }

  private saveChatsData(data: any[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem("chats-data", JSON.stringify(data))
    }
  }
}
