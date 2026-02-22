"use client"

import { Badge } from "@/components/Badges"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"

interface AISuggestionsProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

export function AISuggestions({ suggestions, onSuggestionClick }: AISuggestionsProps) {
  const { t } = useTranslation()

  return (
    <div className="p-4 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="ai" size="sm" icon>
          IA
        </Badge>
        <span className="text-xs text-muted-foreground">{t("chats.aiSmartSuggestions")}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-7 gap-1 bg-transparent"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <Badge variant="ai" size="sm">
              IA
            </Badge>
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
