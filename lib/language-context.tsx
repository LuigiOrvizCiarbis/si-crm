"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "es" | "en" | "pt"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Menu items
    panel: "Panel",
    chats: "Chats",
    contacts: "Contactos",
    pipeline: "Pipeline de ventas",
    tasks: "Tareas",
    automation: "Automatización & IA",
    administration: "Administración",
    configuration: "Configuración",
    // CTAs
    "new-opportunity": "+ Nueva oportunidad",
    "new-conversation": "+ Nueva conversación",
    "new-contact": "+ Nuevo contacto",
    "new-task": "+ Nueva tarea",
  },
  en: {
    // Menu items
    panel: "Dashboard",
    chats: "Chats",
    contacts: "Contacts",
    pipeline: "Sales Pipeline",
    tasks: "Tasks",
    automation: "Automation & AI",
    administration: "Administration",
    configuration: "Settings",
    // CTAs
    "new-opportunity": "+ New opportunity",
    "new-conversation": "+ New conversation",
    "new-contact": "+ New contact",
    "new-task": "+ New task",
  },
  pt: {
    // Menu items
    panel: "Painel",
    chats: "Chats",
    contacts: "Contatos",
    pipeline: "Pipeline de vendas",
    tasks: "Tarefas",
    automation: "Automação & IA",
    administration: "Administração",
    configuration: "Configuração",
    // CTAs
    "new-opportunity": "+ Nova oportunidade",
    "new-conversation": "+ Nova conversa",
    "new-contact": "+ Novo contato",
    "new-task": "+ Nova tarefa",
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es")

  useEffect(() => {
    const stored = localStorage.getItem("language") as Language
    if (stored && ["es", "en", "pt"].includes(stored)) {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || translations.es[key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
