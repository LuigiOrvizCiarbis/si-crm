"use client"

import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, changeLanguage } = useTranslation()

  const toggle = (lang: "es" | "en") => {
    changeLanguage(lang)
  }

  return (
    <div className={cn("flex items-center gap-0.5 text-xs font-medium", className)}>
      <button
        onClick={() => toggle("es")}
        className={cn(
          "px-2 py-0.5 rounded transition-colors",
          language === "es"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ES
      </button>
      <span className="text-muted-foreground/50">|</span>
      <button
        onClick={() => toggle("en")}
        className={cn(
          "px-2 py-0.5 rounded transition-colors",
          language === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  )
}
