import type { Lead } from "./data"

// Stage mapping from dashboard to pipeline
export const STAGE_MAPPING = {
  leads: "prospecto" as const,
  contactados: "contactado" as const,
  seguimiento: "seguimiento" as const,
  entrevistas: "entrevista-pactada" as const,
  reservas: "cierre" as const,
  ventas: "convertido" as const,
}

// Reverse mapping
export const PIPELINE_TO_DASHBOARD: Record<Lead["stage"], keyof typeof STAGE_MAPPING> = {
  prospecto: "leads",
  contactado: "contactados",
  seguimiento: "seguimiento",
  propuesta: "seguimiento",
  interesado: "seguimiento",
  recontactar: "seguimiento",
  "entrevista-pactada": "entrevistas",
  "entrevista-realizada": "entrevistas",
  reagendar: "entrevistas",
  "segunda-entrevista": "entrevistas",
  cierre: "reservas",
  convertido: "ventas",
  "no-interesa": "leads", // excluded from funnel
  partner: "leads", // excluded from funnel
}

// Get dashboard stage from pipeline stage
export function getDashboardStage(pipelineStage: Lead["stage"]): keyof typeof STAGE_MAPPING {
  return PIPELINE_TO_DASHBOARD[pipelineStage] || "leads"
}

// Calculate dashboard metrics from live pipeline data
export function calculateDashboardMetricsFromPipeline(leads: Lead[]) {
  const metrics = {
    leads: 0,
    contactados: 0,
    seguimiento: 0,
    entrevistas: 0,
    reservas: 0,
    ventas: 0,
  }

  // Exclude "no-interesa" and "partner" from funnel
  const activeLeads = leads.filter((lead) => lead.stage !== "no-interesa" && lead.stage !== "partner")

  activeLeads.forEach((lead) => {
    const dashboardStage = getDashboardStage(lead.stage)
    metrics[dashboardStage]++
  })

  return metrics
}

// Get channel distribution from pipeline
export function getChannelDistributionFromPipeline(leads: Lead[]) {
  const channelCounts: Record<string, number> = {}

  leads.forEach((lead) => {
    channelCounts[lead.source] = (channelCounts[lead.source] || 0) + 1
  })

  const total = leads.length
  return Object.entries(channelCounts).map(([channel, count]) => ({
    channel,
    count,
    percentage: (count / total) * 100,
  }))
}

// Get vendor stats from pipeline
export function getVendorStatsFromPipeline(leads: Lead[]) {
  const vendorData: Record<string, { leads: number; ventas: number }> = {}

  leads.forEach((lead) => {
    const vendor = lead.owner || lead.vendedor
    if (!vendorData[vendor]) {
      vendorData[vendor] = { leads: 0, ventas: 0 }
    }
    vendorData[vendor].leads++
    if (lead.stage === "convertido") {
      vendorData[vendor].ventas++
    }
  })

  return Object.entries(vendorData)
    .map(([name, data]) => ({
      name,
      ...data,
      conversion: data.leads > 0 ? (data.ventas / data.leads) * 100 : 0,
    }))
    .sort((a, b) => b.ventas - a.ventas)
}
