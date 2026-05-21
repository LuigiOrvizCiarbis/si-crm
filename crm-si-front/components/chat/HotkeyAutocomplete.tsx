"use client"

import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/useTranslation"
import type { MessageHotkey } from "@/lib/api/message-hotkeys"
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"

interface HotkeyAutocompleteProps {
  hotkeys: MessageHotkey[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onSelect: (hotkey: MessageHotkey) => void
  anchorRef: RefObject<HTMLElement | null>
}

interface Position {
  left: number
  bottom: number
  width: number
}

export function HotkeyAutocomplete({
  hotkeys,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  anchorRef,
}: HotkeyAutocompleteProps) {
  const { t } = useTranslation()
  const listRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    const updatePosition = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top,
        width: rect.width,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [anchorRef])

  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-index="${activeIndex}"]`,
    )
    active?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  if (!mounted || !position) return null

  const style: React.CSSProperties = {
    position: "fixed",
    left: position.left,
    bottom: position.bottom + 8,
    width: position.width,
    zIndex: 50,
  }

  const content =
    hotkeys.length === 0 ? (
      <div
        style={style}
        className="bg-popover border border-border rounded-md shadow-md p-3 text-sm text-muted-foreground"
      >
        {t("chats.hotkeys.noMatches")}
      </div>
    ) : (
      <div
        style={style}
        className="bg-popover border border-border rounded-md shadow-md max-h-64 overflow-hidden"
      >
        <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
          {hotkeys.map((hotkey, index) => (
            <button
              key={hotkey.id}
              data-index={index}
              type="button"
              className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-accent transition-colors ${
                index === activeIndex ? "bg-accent" : ""
              }`}
              onMouseEnter={() => onActiveIndexChange(index)}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(hotkey)
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">/{hotkey.trigger}</span>
                  <Badge
                    variant={hotkey.scope === "tenant" ? "secondary" : "outline"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {hotkey.scope === "tenant"
                      ? t("chats.hotkeys.scope.tenant")
                      : t("chats.hotkeys.scope.personal")}
                  </Badge>
                </div>
                {hotkey.description && (
                  <div className="text-xs text-muted-foreground truncate">{hotkey.description}</div>
                )}
                <div className="text-xs text-muted-foreground/80 truncate mt-0.5">
                  {hotkey.content}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )

  return createPortal(content, document.body)
}
