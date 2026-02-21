"use client"

import { useMemo } from "react"
import { useConfigStore } from "@/store/useConfigStore"
import { getTranslator } from "@/lib/i18n"

export function useTranslation() {
  const { language, setLanguage } = useConfigStore()
  const t = useMemo(() => getTranslator(language), [language])
  return { t, language, changeLanguage: setLanguage }
}
