import { FilterType } from "@/data/types"

interface FilteredConversationsHeaderProps {
    activeFilter: FilterType
}

const filterTitles: Record<FilterType, string> = {
    todos: "Todas las conversaciones",
    "no-leidos": "Conversaciones no leídas",
    whatsapp: "Conversaciones de WhatsApp",
    instagram: "Conversaciones de Instagram",
    facebook: "Conversaciones de Facebook",
    manual: "Conversaciones manuales",
    linkedin: "Conversaciones de LinkedIn",
    telegram: "Conversaciones de Telegram",
    web: "Conversaciones web",
    mail: "Conversaciones por correo",
}

export function FilteredConversationsHeader({ activeFilter }: FilteredConversationsHeaderProps) {
    return (
        <div className="p-4 border-b border-border bg-card">
            <h3 className="font-medium">{filterTitles[activeFilter]}</h3>
        </div>
    )
}
