"use client"

import { useState } from "react"
import Link from "next/link"

const content = {
  en: {
    title: "Terms and Conditions",
    lastUpdated: "Last updated: March 24, 2026",
    login: "Log in",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: (
          <p>
            By accessing or using the Social Impulse CRM platform (the &quot;Service&quot;), you agree
            to be bound by these Terms and Conditions. If you do not agree to these terms, you
            may not use the Service. These terms apply to all users, including businesses and
            individuals who access the platform.
          </p>
        ),
      },
      {
        title: "2. Description of Service",
        content: (
          <>
            <p>
              Social Impulse is a multi-channel CRM platform that enables businesses to manage
              conversations and contacts across messaging channels including WhatsApp, Instagram,
              and Facebook. The Service includes features such as:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Multi-channel messaging management</li>
              <li>Contact and lead management</li>
              <li>Sales pipeline and opportunity tracking</li>
              <li>AI-powered conversation analysis and automation</li>
              <li>Team collaboration tools</li>
              <li>Analytics and reporting</li>
            </ul>
          </>
        ),
      },
      {
        title: "3. Account Registration",
        content: (
          <>
            <p>To use the Service, you must create an account and provide accurate, complete information. You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Ensuring your contact information remains current and accurate</li>
            </ul>
          </>
        ),
      },
      {
        title: "4. Acceptable Use",
        content: (
          <>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Send spam, unsolicited messages, or bulk messaging through connected channels</li>
              <li>Violate the terms of service of third-party platforms (WhatsApp, Instagram, Facebook)</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Impersonate any person or entity</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </>
        ),
      },
      {
        title: "5. Third-Party Platforms",
        content: (
          <>
            <p>The Service integrates with third-party messaging platforms operated by Meta (WhatsApp, Instagram, Facebook). Your use of these integrations is subject to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Meta&apos;s Terms of Service and Platform Policies</li>
              <li>WhatsApp Business Policy and Commerce Policy</li>
              <li>Instagram Platform Policy</li>
              <li>Any additional terms required by the respective platforms</li>
            </ul>
            <p className="mt-2">
              We are not responsible for the availability, functionality, or policies of
              third-party platforms. Changes to their terms may affect the availability of
              certain features within our Service.
            </p>
          </>
        ),
      },
      {
        title: "6. Data and Content",
        content: (
          <p>
            You retain ownership of all data and content you upload or create within the
            Service. By using the Service, you grant us a limited license to process, store,
            and transmit your content as necessary to provide the Service. You are responsible
            for ensuring you have the right to use and share any data you input into the
            platform, including contact information and message content.
          </p>
        ),
      },
      {
        title: "7. Privacy",
        content: (
          <p>
            Your use of the Service is also governed by our{" "}
            <Link href="/privacy-policy" className="text-primary underline">Privacy Policy</Link>,
            which describes how we collect, use, and protect your information.
          </p>
        ),
      },
      {
        title: "8. Payment and Billing",
        content: (
          <>
            <p>Certain features of the Service may require a paid subscription. By subscribing to a paid plan:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You agree to pay the fees associated with your selected plan</li>
              <li>Fees are billed in advance on a recurring basis (monthly or annually)</li>
              <li>You authorize us to charge your payment method on file</li>
              <li>Refunds are handled according to our refund policy</li>
              <li>We reserve the right to change pricing with prior notice</li>
            </ul>
          </>
        ),
      },
      {
        title: "9. Service Availability",
        content: (
          <p>
            We strive to maintain high availability of the Service but do not guarantee
            uninterrupted access. We may temporarily suspend the Service for maintenance,
            updates, or due to circumstances beyond our control. We will make reasonable
            efforts to notify users of planned downtime.
          </p>
        ),
      },
      {
        title: "10. Intellectual Property",
        content: (
          <p>
            The Service, including its design, code, features, and branding, is the
            intellectual property of Social Impulse. You may not copy, modify, distribute,
            or create derivative works based on the Service without our prior written consent.
          </p>
        ),
      },
      {
        title: "11. Limitation of Liability",
        content: (
          <p>
            To the maximum extent permitted by law, Social Impulse shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, including but
            not limited to loss of profits, data, or business opportunities, arising from your
            use of the Service. Our total liability shall not exceed the amount you paid for the
            Service in the twelve (12) months preceding the claim.
          </p>
        ),
      },
      {
        title: "12. Termination",
        content: (
          <p>
            We may suspend or terminate your access to the Service at any time if you violate
            these Terms. You may cancel your account at any time. Upon termination, your right
            to use the Service ceases immediately. We will retain your data for a reasonable
            period as described in our Privacy Policy.
          </p>
        ),
      },
      {
        title: "13. Changes to Terms",
        content: (
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of
            significant changes by posting the updated terms on this page and updating the
            &quot;Last updated&quot; date. Continued use of the Service after changes constitutes
            acceptance of the revised terms.
          </p>
        ),
      },
      {
        title: "14. Contact Us",
        content: (
          <>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <ul className="list-none pl-0 space-y-1 mt-2">
              <li><strong>Email:</strong> legal@socialimpulse.com</li>
              <li><strong>Company:</strong> Social Impulse</li>
            </ul>
          </>
        ),
      },
    ],
  },
  es: {
    title: "Términos y Condiciones",
    lastUpdated: "Última actualización: 24 de marzo de 2026",
    login: "Iniciar sesión",
    sections: [
      {
        title: "1. Aceptación de los Términos",
        content: (
          <p>
            Al acceder o utilizar la plataforma Social Impulse CRM (el &quot;Servicio&quot;), usted acepta
            quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con estos
            términos, no podrá utilizar el Servicio. Estos términos se aplican a todos los usuarios,
            incluyendo empresas e individuos que acceden a la plataforma.
          </p>
        ),
      },
      {
        title: "2. Descripción del Servicio",
        content: (
          <>
            <p>
              Social Impulse es una plataforma CRM multicanal que permite a las empresas gestionar
              conversaciones y contactos a través de canales de mensajería incluyendo WhatsApp, Instagram
              y Facebook. El Servicio incluye funcionalidades como:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestión de mensajería multicanal</li>
              <li>Gestión de contactos y leads</li>
              <li>Pipeline de ventas y seguimiento de oportunidades</li>
              <li>Análisis de conversaciones y automatización con IA</li>
              <li>Herramientas de colaboración en equipo</li>
              <li>Analítica y reportes</li>
            </ul>
          </>
        ),
      },
      {
        title: "3. Registro de Cuenta",
        content: (
          <>
            <p>Para utilizar el Servicio, debe crear una cuenta y proporcionar información precisa y completa. Usted es responsable de:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Mantener la confidencialidad de las credenciales de su cuenta</li>
              <li>Todas las actividades que ocurran bajo su cuenta</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta</li>
              <li>Asegurar que su información de contacto se mantenga actualizada y precisa</li>
            </ul>
          </>
        ),
      },
      {
        title: "4. Uso Aceptable",
        content: (
          <>
            <p>Usted se compromete a no:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Usar el Servicio para cualquier propósito ilegal o en violación de leyes aplicables</li>
              <li>Enviar spam, mensajes no solicitados o mensajería masiva a través de los canales conectados</li>
              <li>Violar los términos de servicio de plataformas de terceros (WhatsApp, Instagram, Facebook)</li>
              <li>Intentar obtener acceso no autorizado al Servicio o sus sistemas relacionados</li>
              <li>Cargar código malicioso, virus o contenido dañino</li>
              <li>Hacerse pasar por cualquier persona o entidad</li>
              <li>Usar el Servicio para acosar, abusar o dañar a otros</li>
              <li>Revender o redistribuir el Servicio sin autorización</li>
            </ul>
          </>
        ),
      },
      {
        title: "5. Plataformas de Terceros",
        content: (
          <>
            <p>El Servicio se integra con plataformas de mensajería de terceros operadas por Meta (WhatsApp, Instagram, Facebook). Su uso de estas integraciones está sujeto a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Los Términos de Servicio y Políticas de Plataforma de Meta</li>
              <li>La Política Comercial y de Negocios de WhatsApp</li>
              <li>La Política de Plataforma de Instagram</li>
              <li>Cualquier término adicional requerido por las respectivas plataformas</li>
            </ul>
            <p className="mt-2">
              No somos responsables de la disponibilidad, funcionalidad o políticas de las
              plataformas de terceros. Los cambios en sus términos pueden afectar la disponibilidad
              de ciertas funciones dentro de nuestro Servicio.
            </p>
          </>
        ),
      },
      {
        title: "6. Datos y Contenido",
        content: (
          <p>
            Usted conserva la propiedad de todos los datos y contenidos que carga o crea dentro
            del Servicio. Al utilizar el Servicio, nos otorga una licencia limitada para procesar,
            almacenar y transmitir su contenido según sea necesario para proporcionar el Servicio.
            Usted es responsable de asegurar que tiene el derecho de usar y compartir cualquier
            dato que ingrese en la plataforma, incluyendo información de contacto y contenido de mensajes.
          </p>
        ),
      },
      {
        title: "7. Privacidad",
        content: (
          <p>
            Su uso del Servicio también se rige por nuestra{" "}
            <Link href="/privacy-policy" className="text-primary underline">Política de Privacidad</Link>,
            que describe cómo recopilamos, usamos y protegemos su información.
          </p>
        ),
      },
      {
        title: "8. Pago y Facturación",
        content: (
          <>
            <p>Ciertas funcionalidades del Servicio pueden requerir una suscripción de pago. Al suscribirse a un plan de pago:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acepta pagar las tarifas asociadas con su plan seleccionado</li>
              <li>Las tarifas se facturan por adelantado de forma recurrente (mensual o anualmente)</li>
              <li>Nos autoriza a cobrar a su método de pago registrado</li>
              <li>Los reembolsos se manejan de acuerdo con nuestra política de reembolsos</li>
              <li>Nos reservamos el derecho de cambiar los precios con aviso previo</li>
            </ul>
          </>
        ),
      },
      {
        title: "9. Disponibilidad del Servicio",
        content: (
          <p>
            Nos esforzamos por mantener una alta disponibilidad del Servicio, pero no garantizamos
            acceso ininterrumpido. Podemos suspender temporalmente el Servicio por mantenimiento,
            actualizaciones o debido a circunstancias fuera de nuestro control. Haremos esfuerzos
            razonables para notificar a los usuarios sobre tiempos de inactividad planificados.
          </p>
        ),
      },
      {
        title: "10. Propiedad Intelectual",
        content: (
          <p>
            El Servicio, incluyendo su diseño, código, funcionalidades y marca, es propiedad
            intelectual de Social Impulse. No puede copiar, modificar, distribuir o crear obras
            derivadas basadas en el Servicio sin nuestro consentimiento previo por escrito.
          </p>
        ),
      },
      {
        title: "11. Limitación de Responsabilidad",
        content: (
          <p>
            En la máxima medida permitida por la ley, Social Impulse no será responsable de ningún
            daño indirecto, incidental, especial, consecuente o punitivo, incluyendo pero no limitado
            a la pérdida de ganancias, datos u oportunidades de negocio, derivados de su uso del
            Servicio. Nuestra responsabilidad total no excederá el monto que usted pagó por el
            Servicio en los doce (12) meses anteriores al reclamo.
          </p>
        ),
      },
      {
        title: "12. Terminación",
        content: (
          <p>
            Podemos suspender o terminar su acceso al Servicio en cualquier momento si viola
            estos Términos. Puede cancelar su cuenta en cualquier momento. Al terminarse, su
            derecho a usar el Servicio cesa inmediatamente. Retendremos sus datos por un período
            razonable como se describe en nuestra Política de Privacidad.
          </p>
        ),
      },
      {
        title: "13. Cambios a los Términos",
        content: (
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Notificaremos
            a los usuarios de cambios significativos publicando los términos actualizados en esta
            página y actualizando la fecha de &quot;Última actualización&quot;. El uso continuado del Servicio
            después de los cambios constituye la aceptación de los términos revisados.
          </p>
        ),
      },
      {
        title: "14. Contáctenos",
        content: (
          <>
            <p>Si tiene alguna pregunta sobre estos Términos, contáctenos en:</p>
            <ul className="list-none pl-0 space-y-1 mt-2">
              <li><strong>Email:</strong> legal@socialimpulse.com</li>
              <li><strong>Empresa:</strong> Social Impulse</li>
            </ul>
          </>
        ),
      },
    ],
  },
}

export default function TermsPage() {
  const [lang, setLang] = useState<"en" | "es">("es")
  const t = content[lang]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Social Impulse
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              <button
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${lang === "es" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                EN
              </button>
            </div>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.login}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.lastUpdated}</p>

        <div className="space-y-8">
          {t.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              <div className="text-muted-foreground leading-relaxed">{section.content}</div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 flex justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
            {lang === "es" ? "Política de Privacidad" : "Privacy Policy"}
          </Link>
          <span>&copy; {new Date().getFullYear()} Social Impulse. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
