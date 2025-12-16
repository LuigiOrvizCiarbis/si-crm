export interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  position: string
  source: "WhatsApp" | "Instagram" | "Facebook" | "LinkedIn" | "Telegram" | "Web" | "Email"
  accountId?: string // Chat account ID
  conversationId?: string // Chat conversation ID
  value: number
  leadScore: number
  stage:
    | "prospecto"
    | "contactado"
    | "seguimiento"
    | "propuesta"
    | "interesado"
    | "recontactar"
    | "entrevista-pactada"
    | "entrevista-realizada"
    | "reagendar"
    | "segunda-entrevista"
    | "cierre"
    | "convertido"
    | "no-interesa"
    | "partner"
  probability: number
  estimatedDate: string
  lastContact: string
  owner: string
  vendedor: string
  queBusca: string
  tipoPropiedad: string
  zonaBarrio: string
  notas: string
  tags: string[]
  avatar?: string
  status: "lead" | "qualified" | "customer" | "inactive"
  createdAt: string
  sortIndex?: number // Added sortIndex for ordering within stages
}

// Centralized lead data with unique IDs linking all modules
export const leadsData: Lead[] = [
  {
    id: "lead-1",
    name: "María González",
    company: "Tech Solutions SA",
    email: "maria@empresa.com",
    phone: "+54 9 223 555-1234",
    position: "Directora de Marketing",
    source: "WhatsApp",
    accountId: "wp1",
    conversationId: "conv1",
    value: 45000,
    leadScore: 85,
    stage: "seguimiento",
    probability: 40,
    estimatedDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    lastContact: "Hace 2h",
    owner: "Martín",
    vendedor: "Martín",
    queBusca: "Alquiler",
    tipoPropiedad: "Depto 3 amb.",
    zonaBarrio: "Chauvín, Aldrey, Güemes",
    notas: "Familia de 4 personas, luminoso, c/cochera y balcón a la calle.",
    tags: ["VIP", "Enterprise"],
    status: "qualified",
    createdAt: "2024-01-15",
    avatar: "/placeholder.svg",
    sortIndex: 0, // Added sortIndex
  },
  {
    id: "lead-2",
    name: "Carlos Pérez",
    company: "StartupIO",
    email: "carlos@startup.io",
    phone: "+54 9 11 9876-5432",
    position: "CEO",
    source: "Instagram",
    accountId: "ig1",
    conversationId: "conv2",
    value: 38000,
    leadScore: 90,
    stage: "segunda-entrevista",
    probability: 85,
    estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    lastContact: "Hace 1h",
    owner: "Valeria",
    vendedor: "Valeria",
    queBusca: "Venta",
    tipoPropiedad: "Oficina comercial",
    zonaBarrio: "Microcentro",
    notas: "Busca espacio para equipo de 15 personas.",
    tags: ["Startup", "Tech"],
    status: "qualified",
    createdAt: "2024-01-14",
    avatar: "/placeholder.svg",
    sortIndex: 0, // Added sortIndex
  },
  {
    id: "lead-3",
    name: "Ana Martín",
    company: "Retail Plus",
    email: "ana@retail.com",
    phone: "+54 9 223 5555-1234",
    position: "Gerente de Ventas",
    source: "WhatsApp",
    accountId: "wp2",
    conversationId: "conv3",
    value: 52000,
    leadScore: 75,
    stage: "interesado",
    probability: 65,
    estimatedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    lastContact: "Hace 3h",
    owner: "Valeria",
    vendedor: "Valeria",
    queBusca: "Venta",
    tipoPropiedad: "PH",
    zonaBarrio: "Parque Luro",
    notas: "Tiene apuro, está en sucesión.",
    tags: ["Retail", "Recurrente"],
    status: "qualified",
    createdAt: "2024-01-13",
    avatar: "/placeholder.svg",
    sortIndex: 0, // Added sortIndex
  },
  {
    id: "lead-4",
    name: "Roberto Silva",
    company: "Silva Inversiones",
    email: "roberto@silva.com",
    phone: "+54 9 11 4444-5555",
    position: "Director",
    source: "LinkedIn",
    value: 65000,
    leadScore: 88,
    stage: "prospecto",
    probability: 15,
    estimatedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    lastContact: "Hace 6h",
    owner: "Martín",
    vendedor: "Martín",
    queBusca: "Alquiler",
    tipoPropiedad: "Local comercial",
    zonaBarrio: "Centro",
    notas: "Interesado en local para negocio.",
    tags: ["Nuevo"],
    status: "lead",
    createdAt: "2024-01-16",
    sortIndex: 0, // Added sortIndex
  },
  {
    id: "lead-5",
    name: "Laura Fernández",
    company: "Fernández & Asociados",
    email: "laura@fernandez.com",
    phone: "+54 9 223 6666-7777",
    position: "Socia",
    source: "Web",
    value: 42000,
    leadScore: 72,
    stage: "contactado",
    probability: 25,
    estimatedDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    lastContact: "Hace 12h",
    owner: "Daniel",
    vendedor: "Daniel",
    queBusca: "Venta",
    tipoPropiedad: "Casa",
    zonaBarrio: "Barrio Norte",
    notas: "Busca casa familiar con jardín.",
    tags: ["Familia"],
    status: "qualified",
    createdAt: "2024-01-15",
    sortIndex: 0, // Added sortIndex
  },
  {
    id: "lead-6",
    name: "Diego Torres",
    company: "Torres SA",
    email: "diego@torres.com",
    phone: "+54 9 11 7777-8888",
    position: "Gerente General",
    source: "Facebook",
    value: 58000,
    leadScore: 80,
    stage: "convertido",
    probability: 100,
    estimatedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    lastContact: "Hace 1 día",
    owner: "Valeria",
    vendedor: "Valeria",
    queBusca: "Alquiler",
    tipoPropiedad: "Oficina",
    zonaBarrio: "Puerto",
    notas: "Cliente confirmado, firmó contrato.",
    tags: ["Cliente", "VIP"],
    status: "customer",
    createdAt: "2024-01-10",
    sortIndex: 0, // Added sortIndex
  },
]

// Calculate stage statistics from actual lead data
export const getStageStats = () => {
  const stages = {
    prospecto: { count: 0, value: 0 },
    contactado: { count: 0, value: 0 },
    seguimiento: { count: 0, value: 0 },
    propuesta: { count: 0, value: 0 },
    interesado: { count: 0, value: 0 },
    recontactar: { count: 0, value: 0 },
    "entrevista-pactada": { count: 0, value: 0 },
    "entrevista-realizada": { count: 0, value: 0 },
    reagendar: { count: 0, value: 0 },
    "segunda-entrevista": { count: 0, value: 0 },
    cierre: { count: 0, value: 0 },
    convertido: { count: 0, value: 0 },
    "no-interesa": { count: 0, value: 0 },
    partner: { count: 0, value: 0 },
  }

  leadsData.forEach((lead) => {
    if (stages[lead.stage]) {
      stages[lead.stage].count++
      stages[lead.stage].value += lead.value
    }
  })

  return stages
}

// Get leads by stage for dashboard visualization
export const getLeadsByStage = (stage: Lead["stage"]) => {
  return leadsData.filter((lead) => lead.stage === stage)
}

// Get total pipeline metrics
export const getPipelineMetrics = () => {
  const totalLeads = leadsData.length
  const totalValue = leadsData.reduce((sum, lead) => sum + lead.value, 0)
  const avgLeadScore = Math.round(leadsData.reduce((sum, lead) => sum + lead.leadScore, 0) / totalLeads)
  const weightedValue = Math.round(leadsData.reduce((sum, lead) => sum + (lead.value * lead.probability) / 100, 0))

  return {
    totalLeads,
    totalValue,
    avgLeadScore,
    weightedValue,
  }
}
