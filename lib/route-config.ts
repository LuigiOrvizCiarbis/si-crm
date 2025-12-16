export interface RouteConfig {
  title: string
  subtitle: string
  ctaLabel?: string
  ctaAction?: () => void
  showSearch?: boolean
  showFilters?: boolean
  searchPlaceholder?: string
  filterOptions?: string[]
}

export const routeConfigs: Record<string, RouteConfig> = {
  "/": {
    title: "Panel",
    subtitle: "Resumen general de tu operación comercial",
    showSearch: false,
    showFilters: false,
  },
  "/chats": {
    title: "Chats",
    subtitle: "Gestiona conversaciones omnicanal",
    ctaLabel: "+ Nueva conversación",
    showSearch: true,
    showFilters: true,
    searchPlaceholder: "Buscar conversaciones...",
  },
  "/contactos": {
    title: "Contactos",
    subtitle: "Administra tus leads y clientes",
    ctaLabel: "+ Nuevo contacto",
    showSearch: true,
    showFilters: true,
    searchPlaceholder: "Buscar contactos...",
  },
  "/oportunidades": {
    title: "Pipeline de Oportunidades",
    subtitle: "Gestiona tus leads a través del embudo de ventas",
    ctaLabel: "+ Nueva oportunidad",
    showSearch: true,
    showFilters: true,
    searchPlaceholder: "Buscar oportunidades...",
  },
  "/tareas": {
    title: "Tareas",
    subtitle: "Organiza el seguimiento del equipo",
    ctaLabel: "+ Nueva tarea",
    showSearch: true,
    showFilters: true,
    searchPlaceholder: "Buscar tareas...",
  },
  "/automatizacion": {
    title: "Automatización & IA",
    subtitle: "Optimiza tus procesos de ventas con automatizaciones inteligentes",
    ctaLabel: "+ Nueva automatización",
    showSearch: false,
    showFilters: false,
  },
  "/automatizacion/plantillas-wa": {
    title: "Plantillas WA",
    subtitle: "Crea y gestiona plantillas para WhatsApp",
    ctaLabel: "+ Nueva plantilla",
    showSearch: true,
    showFilters: true,
    searchPlaceholder: "Buscar plantillas...",
  },
  "/automatizacion/difusiones-wa": {
    title: "Difusiones WA",
    subtitle: "Crea campañas de difusión por WhatsApp",
    ctaLabel: "+ Nueva difusión",
    showSearch: true,
    showFilters: true,
    searchPlaceholder: "Buscar difusiones...",
  },
  "/analytics-ia": {
    title: "Analytics IA",
    subtitle: "Análisis predictivo con inteligencia artificial",
    showSearch: false,
    showFilters: false,
  },
  "/asignacion-ia": {
    title: "Asignación IA",
    subtitle: "Asignación inteligente de leads y conversaciones",
    showSearch: false,
    showFilters: false,
  },
  "/asistente-ia": {
    title: "Asistente IA",
    subtitle: "Asistente conversacional con IA para tu equipo",
    showSearch: false,
    showFilters: false,
  },
  "/chatbot": {
    title: "Chatbot",
    subtitle: "Configura respuestas automáticas inteligentes",
    ctaLabel: "+ Nuevo chatbot",
    showSearch: false,
    showFilters: false,
  },
  "/administracion": {
    title: "Administración",
    subtitle: "Gestión general de cuentas, usuarios y sistema",
    showSearch: false,
    showFilters: false,
  },
  "/configuracion": {
    title: "Configuración",
    subtitle: "Preferencias y ajustes del sistema",
    showSearch: false,
    showFilters: false,
  },
  "/pricing": {
    title: "Planes y Precios",
    subtitle: "Selecciona el plan perfecto para tu negocio",
    showSearch: false,
    showFilters: false,
  },
}

export function getRouteConfig(pathname: string): RouteConfig | null {
  // Exact match first
  if (routeConfigs[pathname]) {
    return routeConfigs[pathname]
  }

  // Prefix match for subsections
  const sortedRoutes = Object.keys(routeConfigs).sort((a, b) => b.length - a.length)
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route) && route !== "/") {
      return routeConfigs[route]
    }
  }

  return null
}
