"use client"

import { useState } from "react"
import { Download, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/hooks/useTranslation"

interface ContactsCompactHeaderProps {
  onSearch?: (query: string) => void
  onStatusFilter?: (status: string) => void
  onExportCSV?: () => void
  onNewContact?: () => void
}

export function ContactsCompactHeader({
  onSearch,
  onStatusFilter,
  onExportCSV,
  onNewContact,
}: ContactsCompactHeaderProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const handleSearchChange = (value: string): void => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleStatusChange = (value: string): void => {
    setStatusFilter(value)
    onStatusFilter?.(value)
  }

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="h-[75px] px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            {t("contactsPage.title")}
          </h1>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("contactsPage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px] h-9 hidden sm:flex">
              <SelectValue placeholder={t("contactsPage.filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("contactsPage.filters.all")}</SelectItem>
              <SelectItem value="lead">{t("contactsPage.filters.lead")}</SelectItem>
              <SelectItem value="qualified">{t("contactsPage.filters.qualified")}</SelectItem>
              <SelectItem value="customer">{t("contactsPage.filters.customer")}</SelectItem>
              <SelectItem value="inactive">{t("contactsPage.filters.inactive")}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="hidden md:flex gap-2 h-9 bg-transparent"
          >
            <Download className="w-4 h-4" />
            {t("contactsPage.actions.exportCsv")}
          </Button>

          <Button size="sm" onClick={onNewContact} className="h-9">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{t("contactsPage.actions.newContact")}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
