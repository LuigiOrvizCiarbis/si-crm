"use client"

import type React from "react"
import { useState } from "react"
import { Filter, MessageSquare, Plus, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NotificationsBell } from "@/components/notifications-bell"
import { useTranslation } from "@/hooks/useTranslation"

interface PipelineCompactHeaderProps {
  onNewOpportunity?: () => void
  onSearch?: (query: string) => void
  onFilterChannel?: (channel: string) => void
  onFilterSalesperson?: (salesperson: string) => void
}

export function PipelineCompactHeader({
  onNewOpportunity,
  onSearch,
  onFilterChannel,
  onFilterSalesperson,
}: PipelineCompactHeaderProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("all")
  const [selectedSalesperson, setSelectedSalesperson] = useState("all")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleChannelChange = (value: string): void => {
    setSelectedChannel(value)
    onFilterChannel?.(value)
  }

  const handleSalespersonChange = (value: string): void => {
    setSelectedSalesperson(value)
    onFilterSalesperson?.(value)
  }

  return (
    <header className="sticky top-0 z-40 h-[75px] flex items-center gap-4 px-4 md:px-6 lg:px-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center gap-2 min-w-fit">
        <h1 className="text-xl font-semibold tracking-tight">{t("pipeline.title")}</h1>
      </div>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("pipeline.searchPlaceholder")}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={selectedChannel} onValueChange={handleChannelChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <MessageSquare className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("pipeline.filters.channels")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("pipeline.filters.allChannels")}</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="web">Web</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSalesperson} onValueChange={handleSalespersonChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("pipeline.filters.salesperson")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("pipeline.filters.allSalespeople")}</SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              {t("pipeline.moreFilters")}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t("pipeline.filters.advancedTitle")}</SheetTitle>
              <SheetDescription>{t("pipeline.filters.advancedDesc")}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("pipeline.filters.status")}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t("pipeline.filters.selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("pipeline.filters.statusAll")}</SelectItem>
                    <SelectItem value="new">{t("pipeline.filters.statusNew")}</SelectItem>
                    <SelectItem value="contacted">{t("pipeline.filters.statusContacted")}</SelectItem>
                    <SelectItem value="qualified">{t("pipeline.filters.statusQualified")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("pipeline.filters.valueRange")}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t("pipeline.filters.selectValue")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("pipeline.filters.statusAll")}</SelectItem>
                    <SelectItem value="low">{t("pipeline.filters.valueLow")}</SelectItem>
                    <SelectItem value="medium">{t("pipeline.filters.valueMid")}</SelectItem>
                    <SelectItem value="high">{t("pipeline.filters.valueHigh")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("pipeline.filters.date")}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t("pipeline.filters.datePeriod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{t("pipeline.filters.dateToday")}</SelectItem>
                    <SelectItem value="week">{t("pipeline.filters.dateWeek")}</SelectItem>
                    <SelectItem value="month">{t("pipeline.filters.dateMonth")}</SelectItem>
                    <SelectItem value="all">{t("pipeline.filters.dateAll")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button onClick={onNewOpportunity} size="sm" className="h-9">
          <Plus className="h-4 w-4 mr-2" />
          {t("pipeline.newOpportunity")}
        </Button>
        <NotificationsBell />
      </div>
    </header>
  )
}
