if (typeof window !== "undefined") {
  try {
    // List of all storage keys that might contain emojis
    const keysToCheck = [
      "config-store",
      "app-store",
      "dashboard-store",
      "task-store",
      "contacts-data",
      "pipeline-data",
      "chats-data",
      "language",
    ]

    keysToCheck.forEach((key) => {
      const item = localStorage.getItem(key)
      if (item) {
        try {
          // Try to parse and check if it contains emojis
          const data = JSON.parse(item)
          const jsonString = JSON.stringify(data)

          // Check if string contains any emoji characters (outside Latin1 range)
          const hasEmoji = /[^\u0000-\u00ff]/.test(jsonString)

          if (hasEmoji) {
            console.log(`[v0] Clearing storage key with emoji data: ${key}`)
            localStorage.removeItem(key)
          }
        } catch (e) {
          // If it's not JSON, check the raw string
          const hasEmoji = /[^\u0000-\u00ff]/.test(item)
          if (hasEmoji) {
            console.log(`[v0] Clearing storage key with emoji data: ${key}`)
            localStorage.removeItem(key)
          }
        }
      }
    })

    console.log("[v0] Emoji storage migration completed")
  } catch (error) {
    console.error("[v0] Error during emoji storage migration:", error)
  }
}

export function clearEmojiStorage() {
  // This function is now a no-op since migration runs at module load
  // Kept for backwards compatibility
}
