"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Palette, RotateCcw } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"

const COLOR_SWATCHES = [
  { name: "Blue", hex: "#3b82f6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Fuchsia", hex: "#d946ef" },
]

interface StageColorPickerProps {
  stageId: string
  currentColor: string
}

export function StageColorPicker({ stageId, currentColor }: StageColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [customColor, setCustomColor] = useState(currentColor)
  const { setStageColor, resetStageColor } = useAppStore()

  const handleColorSelect = (color: string) => {
    setStageColor(stageId, color)
    setCustomColor(color)
    setOpen(false)
  }

  const handleReset = () => {
    resetStageColor(stageId)
    const stage = useAppStore.getState().stageColors.find((s) => s.id === stageId)
    if (stage) {
      setCustomColor(stage.color)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Color de etapa</p>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleReset}>
              <RotateCcw className="h-3 w-3 mr-1" />
              <span className="text-xs">Restablecer</span>
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                className="h-10 w-10 rounded-md border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: swatch.hex,
                  borderColor: currentColor === swatch.hex ? "#ffffff" : "transparent",
                  boxShadow: currentColor === swatch.hex ? "0 0 0 2px rgba(0,0,0,0.2)" : "none",
                }}
                onClick={() => handleColorSelect(swatch.hex)}
                title={swatch.name}
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Color personalizado</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-10 w-full rounded-md border cursor-pointer"
              />
              <Button size="sm" variant="outline" onClick={() => handleColorSelect(customColor)}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
