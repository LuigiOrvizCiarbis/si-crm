export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return "El email es requerido"
  if (!emailRegex.test(email)) return "Email inválido"
  return null
}

export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^\+54\s9\s\d{2,3}\s\d{4}-\d{4}$/
  if (!phone) return "El teléfono es requerido"
  if (!phoneRegex.test(phone)) return "Formato: +54 9 XXX XXXX-XXXX"
  return null
}

export const validateScore = (score: string | number): string | null => {
  const numScore = typeof score === "string" ? Number.parseInt(score, 10) : score
  if (isNaN(numScore)) return "Debe ser un número"
  if (numScore < 0 || numScore > 100) return "Debe estar entre 0 y 100"
  return null
}

export const validateRequired = (value: string | number): string | null => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return "Este campo es requerido"
  }
  return null
}

export const ETAPAS_PIPELINE = [
  "Lead/Prospecto",
  "Contactado",
  "En seguimiento",
  "Envié propuesta",
  "Interesado",
  "Re-contactar",
  "Entrevista pactada",
  "Entrevista realizada",
  "Reagendar entrevista",
  "2da Entrevista",
  "Seguimiento para cierre",
  "Cliente Convertido",
  "No le interesa",
  "Partner/Colega",
]

export const QUE_BUSCA_OPTIONS = ["Alquiler", "Venta", "Compra", "Compra cdo.", "Plan de Ahorro"]

export const TIPO_PROPIEDAD_OPTIONS = [
  "Depto 1 amb.",
  "Depto 2 amb.",
  "Depto 3 amb.",
  "PH",
  "Casa",
  "Oficina comercial",
  "Audi A3",
  "VW Amarok V6",
  "VW Polo Highline",
  "Ford Ranger",
  "Toyota Hilux",
]

export const ESTADO_OPTIONS = ["Nuevo", "Activo", "Calificado", "Cliente"]

export const FUENTE_OPTIONS = ["WhatsApp", "Instagram", "Facebook", "LinkedIn", "Webform", "Referido", "Otro"]
