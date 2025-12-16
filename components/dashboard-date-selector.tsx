"use client"

import { useState } from "react"
import { format, subDays, subMonths, startOfWeek, startOfMonth, startOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardDateSelectorProps {
  onDateChange: (range: DateRange | undefined, preset: string) => void
}

export function DashboardDateSelector({ onDateChange }: DashboardDateSelectorProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })
  const [selectedPreset, setSelectedPreset] = useState("este-mes")

  const presets = [
    { value: "hoy", label: "Hoy", getDates: () => ({ from: new Date(), to: new Date() }) },
    {
      value: "ayer",
      label: "Ayer",
      getDates: () => {
        const yesterday = subDays(new Date(), 1)
        return { from: yesterday, to: yesterday }
      },
    },
    {
      value: "esta-semana",
      label: "Esta semana",
      getDates: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: new Date() }),
    },
    { value: "este-mes", label: "Este mes", getDates: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
    {
      value: "mes-pasado",
      label: "Mes pasado",
      getDates: () => {
        const lastMonth = subMonths(new Date(), 1)
        return {
          from: startOfMonth(lastMonth),
          to: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
        }
      },
    },
    {
      value: "ultimos-3-meses",
      label: "Últimos 3 meses",
      getDates: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
    },
    {
      value: "ultimos-6-meses",
      label: "Últimos 6 meses",
      getDates: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
    },
    { value: "este-ano", label: "Este año", getDates: () => ({ from: startOfYear(new Date()), to: new Date() }) },
    {
      value: "historico",
      label: "Histórico",
      getDates: () => ({ from: new Date(2020, 0, 1), to: new Date() }),
    },
    { value: "personalizado", label: "Personalizado", getDates: () => date },
  ]

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value)
    const preset = presets.find((p) => p.value === value)
    if (preset && value !== "personalizado") {
      const newRange = preset.getDates()
      setDate(newRange)
      onDateChange(newRange, value)
    }
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range)
    setSelectedPreset("personalizado")
    onDateChange(range, "personalizado")
  }

  const currentPresetLabel = presets.find((p) => p.value === selectedPreset)?.label || "Seleccionar período"

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPreset === "personalizado" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("h-9 justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM", { locale: es })} - {format(date.to, "dd MMM yyyy", { locale: es })}
                  </>
                ) : (
                  format(date.from, "dd MMM yyyy", { locale: es })
                )
              ) : (
                <span>Seleccionar fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
