import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Users, KanbanSquare, CalendarDays, Bot, ShoppingBag } from "lucide-react"

export const metadata: Metadata = {
  title: "Social Impulse CRM — CRM conversacional con IA para WhatsApp e Instagram",
  description:
    "Social Impulse CRM centraliza las conversaciones de WhatsApp, Instagram y Facebook en una bandeja única, con gestión de contactos, pipeline de ventas y agendamiento de reuniones en Google Calendar.",
  alternates: {
    canonical: "https://sicrmapp.com",
  },
}

const features = [
  {
    icon: MessageSquare,
    title: "Bandeja omnicanal",
    description:
      "Recibí y respondé mensajes de WhatsApp, Instagram y Facebook desde una sola bandeja compartida por todo el equipo, en tiempo real.",
  },
  {
    icon: Users,
    title: "Gestión de contactos",
    description:
      "Cada conversación queda asociada a un contacto con su historial completo, campos personalizables e importación desde CSV.",
  },
  {
    icon: KanbanSquare,
    title: "Pipeline de ventas",
    description:
      "Convertí conversaciones en oportunidades y seguí su avance por las etapas de tu embudo en un tablero Kanban.",
  },
  {
    icon: CalendarDays,
    title: "Agenda de reuniones",
    description:
      "Coordiná reuniones con tus clientes y creá los eventos directamente en el Google Calendar del vendedor, sin salir del chat.",
  },
  {
    icon: Bot,
    title: "Asistente con IA",
    description:
      "Respondé automáticamente las consultas frecuentes con un asistente que conoce tu catálogo y deriva a una persona cuando hace falta.",
  },
  {
    icon: ShoppingBag,
    title: "Catálogo de productos",
    description:
      "Cargá tus productos y precios para consultarlos durante la conversación y compartirlos con el cliente.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold">Social Impulse CRM</span>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            El CRM conversacional para equipos que venden por mensaje
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Social Impulse CRM reúne las conversaciones de WhatsApp, Instagram y Facebook en una sola bandeja,
            las convierte en oportunidades de venta y te deja agendar la reunión con el cliente sin cambiar de
            herramienta.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Crear cuenta gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">Ver planes</Link>
            </Button>
          </div>
        </section>

        <section className="pb-20">
          <h2 className="mb-8 text-center text-2xl font-semibold">Qué podés hacer con Social Impulse CRM</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <feature.icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t py-16">
          <h2 className="text-2xl font-semibold">Cómo usa Social Impulse CRM tus datos de Google</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              Social Impulse CRM se integra con Google Calendar para que puedas agendar reuniones con tus
              clientes desde la conversación. La conexión es opcional: solo se activa si vos elegís vincular tu
              cuenta de Google desde la configuración de la aplicación.
            </p>
            <p>
              Cuando la conectás, usamos el acceso a tu calendario únicamente para consultar tu disponibilidad
              y para crear, actualizar o cancelar los eventos de las reuniones que agendás desde el CRM. No
              usamos esos datos para publicidad, no los vendemos y no los compartimos con terceros. Podés
              revocar el acceso en cualquier momento desde la configuración de la aplicación o desde la página
              de permisos de tu cuenta de Google.
            </p>
            <p>
              El uso que Social Impulse CRM hace de la información recibida de las APIs de Google se ajusta a
              la{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="underline underline-offset-4 hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Datos de Usuario de los Servicios de API de Google
              </a>
              , incluidos los requisitos de Uso Limitado.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Social Impulse. Todos los derechos reservados.</span>
          <nav className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-foreground">
              Política de privacidad
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Términos
            </Link>
            <Link href="/data-deletion" className="hover:text-foreground">
              Eliminación de datos
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
