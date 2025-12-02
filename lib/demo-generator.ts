export interface DemoTargets {
  leads: number
  contactados: number
  seguimiento: number
  entrevistas: number
  reservas: number
  ventas: number
}

export interface DailySeriesData {
  date: string
  leads: number
  contactados: number
  seguimiento: number
  entrevistas: number
  reservas: number
  ventas: number
}

export interface ChannelDistribution {
  channel: string
  count: number
  percentage: number
}

export interface VendedorStats {
  name: string
  ventas: number
  leads: number
  conversion: number
}

// Base targets for demo mode
export const DEMO_TARGETS: DemoTargets = {
  leads: 100,
  contactados: 80,
  seguimiento: 65,
  entrevistas: 45,
  reservas: 25,
  ventas: 15,
}

// Channel distribution (percentages)
const CHANNEL_DISTRIBUTION = {
  WhatsApp: 0.4,
  Instagram: 0.25,
  Web: 0.2,
  Facebook: 0.1,
  LinkedIn: 0.03,
  Telegram: 0.02,
}

// Top vendors (names from your system)
const VENDORS = ["Lucas Coria", "Luigi Orviz", "Pablo Vendedor", "Martín", "Valeria"]

// Generate Gaussian noise
function gaussianNoise(mean: number, stdDev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  return mean + z0 * stdDev
}

// Generate demo targets with controlled jitter (±8%)
export function generateDemoTargets(seed?: number): DemoTargets {
  if (seed) {
    // Simple seeded random for reproducibility
    Math.random = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }

  const jitter = 0.08 // ±8%

  const leads = Math.round(DEMO_TARGETS.leads * (1 + (Math.random() * 2 - 1) * jitter))
  const contactados = Math.min(leads, Math.round(DEMO_TARGETS.contactados * (1 + (Math.random() * 2 - 1) * jitter)))
  const seguimiento = Math.min(
    contactados,
    Math.round(DEMO_TARGETS.seguimiento * (1 + (Math.random() * 2 - 1) * jitter)),
  )
  const entrevistas = Math.min(
    seguimiento,
    Math.round(DEMO_TARGETS.entrevistas * (1 + (Math.random() * 2 - 1) * jitter)),
  )
  const reservas = Math.min(entrevistas, Math.round(DEMO_TARGETS.reservas * (1 + (Math.random() * 2 - 1) * jitter)))
  const ventas = Math.min(reservas, Math.round(DEMO_TARGETS.ventas * (1 + (Math.random() * 2 - 1) * jitter)))

  return { leads, contactados, seguimiento, entrevistas, reservas, ventas }
}

// Generate 30-day time series with realistic progression
export function generateDailySeries(targets: DemoTargets): DailySeriesData[] {
  const days = 30
  const series: DailySeriesData[] = []

  for (let i = 0; i < days; i++) {
    const progress = (i + 1) / days // Acumulated progress
    const noise = 0.06 // ±6% daily noise

    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))

    series.push({
      date: date.toISOString().split("T")[0],
      leads: Math.round(targets.leads * progress * (1 + gaussianNoise(0, noise))),
      contactados: Math.round(targets.contactados * progress * (1 + gaussianNoise(0, noise))),
      seguimiento: Math.round(targets.seguimiento * progress * (1 + gaussianNoise(0, noise))),
      entrevistas: Math.round(targets.entrevistas * progress * (1 + gaussianNoise(0, noise))),
      reservas: Math.round(targets.reservas * progress * (1 + gaussianNoise(0, noise))),
      ventas: Math.round(targets.ventas * progress * (1 + gaussianNoise(0, noise))),
    })
  }

  return series
}

// Generate channel distribution
export function generateChannelDistribution(totalLeads: number): ChannelDistribution[] {
  return Object.entries(CHANNEL_DISTRIBUTION).map(([channel, percentage]) => ({
    channel,
    count: Math.round(totalLeads * percentage),
    percentage: percentage * 100,
  }))
}

// Generate vendor statistics
export function generateVendorStats(targets: DemoTargets): VendedorStats[] {
  // Top 3 vendors get 60% of sales, rest get 40%
  const top3Share = 0.6
  const restShare = 0.4

  return VENDORS.map((name, index) => {
    const isTop3 = index < 3
    const baseShare = isTop3 ? top3Share / 3 : restShare / (VENDORS.length - 3)
    const jitter = Math.random() * 0.2 - 0.1 // ±10% jitter

    const share = baseShare * (1 + jitter)
    const ventas = Math.round(targets.ventas * share)
    const leads = Math.round(targets.leads * share * (1 + Math.random() * 0.3))
    const conversion = leads > 0 ? (ventas / leads) * 100 : 0

    return { name, ventas, leads, conversion }
  }).sort((a, b) => b.ventas - a.ventas)
}

// Calculate conversion rates between stages
export function calculateConversions(targets: DemoTargets) {
  return {
    contactadoRate: targets.leads > 0 ? ((targets.contactados / targets.leads) * 100).toFixed(1) : "0",
    seguimientoRate: targets.contactados > 0 ? ((targets.seguimiento / targets.contactados) * 100).toFixed(1) : "0",
    entrevistaRate: targets.seguimiento > 0 ? ((targets.entrevistas / targets.seguimiento) * 100).toFixed(1) : "0",
    reservaRate: targets.entrevistas > 0 ? ((targets.reservas / targets.entrevistas) * 100).toFixed(1) : "0",
    ventaRate: targets.reservas > 0 ? ((targets.ventas / targets.reservas) * 100).toFixed(1) : "0",
    finalRate: targets.leads > 0 ? ((targets.ventas / targets.leads) * 100).toFixed(1) : "0",
  }
}

// Generate trend vs last month (random ±5-12%)
export function generateTrends() {
  return {
    leads: (Math.random() * 17 - 5).toFixed(1), // -5 to +12
    contactados: (Math.random() * 17 - 5).toFixed(1),
    seguimiento: (Math.random() * 17 - 5).toFixed(1),
    entrevistas: (Math.random() * 17 - 5).toFixed(1),
    reservas: (Math.random() * 17 - 5).toFixed(1),
    ventas: (Math.random() * 17 - 5).toFixed(1),
  }
}
