export type BillingCycle = "1mes" | "3meses" | "6meses" | "1año" | "2años" | "3años" | "4años"

export const billingCycles: { value: BillingCycle; label: string }[] = [
  { value: "1mes", label: "1 mes" },
  { value: "3meses", label: "3 meses" },
  { value: "6meses", label: "6 meses" },
  { value: "1año", label: "1 año" },
  { value: "2años", label: "2 años" },
  { value: "3años", label: "3 años" },
  { value: "4años", label: "4 años" },
]

export const baseAll = [
  { key: "metrics", label: "Métricas", note: "básicas en Starter; avanzadas según plan" },
  { key: "contacts", label: "Contactos (base de datos)" },
]

export const planFeatures = {
  starter: [
    ...baseAll.map((f) => ({ ...f, label: f.key === "metrics" ? "Métricas básicas" : f.label })),
    { key: "users", label: "1 usuario" },
    { key: "channels", label: "1 WhatsApp" },
    { key: "conv", label: "3.000 conversaciones/mes" },
  ],
  classic: [
    { key: "channels_per", label: "1 cuenta por canal (1 WP, 1 IG, …)" },
    { key: "pipeline", label: "Embudo" },
    { key: "tasks", label: "Tareas" },
  ],
  intermediate: [
    { key: "users4", label: "4 usuarios" },
    { key: "channels4", label: "4 cuentas por canal" },
    { key: "contacts_agent", label: "Contactos por agente" },
    { key: "pipeline_agent1", label: "1 embudo por agente" },
    { key: "tasks_agent", label: "Tareas por agente" },
    { key: "ai_bot", label: "Chatbot con IA" },
    { key: "payments_module", label: "Módulo administración de pagos" },
    { key: "conv5k", label: "5.000 conversaciones/mes" },
  ],
  high: [
    { key: "users11", label: "11 usuarios (10 vendedores + admin)" },
    { key: "channels11", label: "11 cuentas por canal" },
    { key: "pipeline_agent2", label: "2 embudos por agente" },
    { key: "productivity_panel", label: "Panel de métricas productividad/efectividad" },
    { key: "ai_advanced", label: "Automatizaciones con IA avanzada" },
    { key: "ai_remarketing", label: "Re-marketing automatizado con IA" },
    { key: "extra_user", label: "+ USD 50 por usuario extra" },
    { key: "conv15k", label: "15.000 conversaciones/mes" },
  ],
  enterprise: [
    { key: "custom_users", label: "Usuarios: Custom" },
    { key: "custom_channels", label: "Cuentas por canal: Custom" },
    { key: "custom_conv", label: "Conversaciones/mes: Custom" },
    { key: "custom_struct", label: "Tareas/Embudos/BD por usuario: Custom" },
    { key: "custom_ai", label: "IA (chatbot/remarketing): Custom" },
  ],
  agency: [
    { key: "whitelabel", label: "Marca blanca / estética personalizada" },
    { key: "subclients", label: "Sub-clientes: Custom" },
    { key: "sub_users", label: "Usuarios por sub-cliente: Custom" },
    { key: "sub_conv", label: "Conversaciones por sub-cliente: Custom" },
    { key: "sub_ai", label: "IA por sub-cliente (chatbot o full): Custom" },
  ],
}

export const plans = [
  {
    id: "starter",
    nombre: "Starter",
    precio: 50,
    cta: "Contratar",
    recommended: false,
    bestselling: false,
  },
  {
    id: "classic",
    nombre: "Classic",
    precio: 100,
    cta: "Contratar",
    recommended: false,
    bestselling: false,
  },
  {
    id: "intermediate",
    nombre: "Intermediate",
    precio: 250,
    cta: "Probar / Contratar",
    recommended: true,
    bestselling: false,
  },
  {
    id: "high",
    nombre: "High",
    precio: 500,
    cta: "Contratar",
    recommended: false,
    bestselling: true,
  },
  {
    id: "enterprise",
    nombre: "Enterprise",
    precio: null,
    cta: "Contactar ventas",
    recommended: false,
    bestselling: false,
  },
  {
    id: "agency",
    nombre: "Agency white label",
    precio: null,
    cta: "Hablar con ventas",
    recommended: false,
    bestselling: false,
  },
]

export const comparisonRows = [
  // Sección 1: Funcionalidades Principales
  {
    section: "Funcionalidades Principales",
    name: "Métricas",
    values: [
      "Básicas",
      "Básicas",
      "Completas",
      "Avanzadas",
      "Avanzadas con productividad/efectividad",
      "Avanzadas con productividad/efectividad",
    ],
  },
  { section: "Funcionalidades Principales", name: "Contactos (base de datos)", values: ["✓", "✓", "✓", "✓", "✓", "✓"] },
  { section: "Funcionalidades Principales", name: "Pipeline/Embudo", values: ["—", "✓", "✓", "✓", "✓", "✓"] },
  { section: "Funcionalidades Principales", name: "Tareas", values: ["—", "✓", "✓", "✓", "✓", "✓"] },
  {
    section: "Funcionalidades Principales", 
    name: "Roles y permisos", 
    values: ["—", "—", "✓", "✓", "✓", "✓"]
  },

  // Sección 2: Usuarios y Conversaciones
  {
    section: "Usuarios y Conversaciones",
    name: "Cantidad de usuarios",
    values: ["1", "1", "4", "11", "Custom", "Custom por sub-cliente"],
  },
  {
    section: "Usuarios y Conversaciones",
    name: "Conversaciones nuevas al mes",
    values: ["3.000", "3.000", "5.000", "15.000", "Custom", "Custom por sub-cliente"],
  },
  {
    section: "Usuarios y Conversaciones",
    name: "+ por cada usuario extra",
    values: ["-", "U$D 100", "U$D 75", "U$D 50", "Custom", "Custom por sub-cliente"],
  },
  {
    section: "Usuarios y Conversaciones",
    name: "+ por cada 1000 conversaciones extra",
    values: ["-", "U$D 100", "U$D 75", "U$D 50", "Custom", "Custom por sub-cliente"],
  },
  {
    section: "Usuarios y Conversaciones", 
    name: "Cantidad sub-clientes", 
    values: ["—", "—", "—", "—", "—", "Custom"]
  },
  
  // Sección 3: IA & Automatización
  { section: "IA & Automatización", name: "Chatbot IA", values: ["—", "—", "✓", "✓", "✓", "Custom por sub-cliente"] },
  { section: "IA & Automatización", name: "IA avanzada", values: ["—", "—", "—", "✓", "✓", "Custom por sub-cliente"] },
  { section: "IA & Automatización", name: "Plan re-marketing con IA", values: ["—", "—", "—", "✓", "✓", "Custom por sub-cliente"] },

  // Sección 4: Adicionales
  { section: "Adicionales", name: "Soporte prioritario", values: ["—", "—", "—", "✓", "✓", "✓"] },
  { section: "Adicionales", name: "Look&Feel Personalizado", values: ["—", "—", "—", "—", "✓", "✓"] },
  { section: "Adicionales", name: "Módulos a medida", values: ["—", "—", "—", "—", "✓", "✓"] },
  { section: "Adicionales", name: "Integraciones a medida", values: ["—", "—", "—", "—", "✓", "✓"] },
  { section: "Adicionales", name: "Marca Blanca", values: ["—", "—", "—", "—", "—", "✓"] },

  // Sección 5: Cantidad cuentas por canal
  { section: "Cantidad cuentas por canal", name: "WhatsApp", values: ["1", "1", "4", "11", "Custom", "Custom"] },
  { section: "Cantidad cuentas por canal", name: "Telegram", values: ["—", "1", "4", "11", "Custom", "Custom"] },
  { section: "Cantidad cuentas por canal", name: "Instagram", values: ["—", "1", "4", "11", "Custom", "Custom"] },
  {
    section: "Cantidad cuentas por canal",
    name: "Facebook Messenger",
    values: ["—", "1", "4", "11", "Custom", "Custom"],
  },
  { section: "Cantidad cuentas por canal", name: "LinkedIn", values: ["—", "1", "4", "11", "Custom", "Custom"] },
  { section: "Cantidad cuentas por canal", name: "TikTok", values: ["—", "1", "4", "11", "Custom", "Custom"] },
  {
    section: "Cantidad cuentas por canal",
    name: "Gmail Outlook (hotmail) Mail corporativo (web mail)",
    values: ["—", "1", "4", "11", "Custom", "Custom"],
  },
  { section: "Cantidad cuentas por canal", name: "Formulario Web", values: ["—", "1", "4", "11", "Custom", "Custom"] },
  {
    section: "Cantidad cuentas por canal",
    name: "Chat flotante Web",
    values: ["—", "1", "4", "11", "Custom", "Custom"],
  },
]

export function buildCumulativeFeatures(planId: string) {
  const order = ["starter", "classic", "intermediate", "high", "enterprise", "agency"]
  const planIndex = order.indexOf(planId)

  const accumulated: Array<{ key: string; label: string; isNew: boolean }> = []

  for (let i = 0; i <= planIndex; i++) {
    const currentPlan = order[i]
    const features = planFeatures[currentPlan as keyof typeof planFeatures]

    features.forEach((feature) => {
      if (!accumulated.find((f) => f.key === feature.key)) {
        accumulated.push({
          ...feature,
          isNew: i === planIndex,
        })
      }
    })
  }

  return accumulated
}
