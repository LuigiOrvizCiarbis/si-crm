"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/Toast"
import {
  CheckCircle,
  MessageSquare,
  Instagram,
  Facebook,
  Globe,
  Mail,
  ArrowRight,
  ArrowLeft,
  Zap,
  AlertCircle,
  Phone,
} from "lucide-react"

interface WizardConnectChannelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3
type Channel = "whatsapp" | "instagram" | "facebook" | "web" | "email"

const channelInfo = {
  whatsapp: {
    name: "WhatsApp Business",
    icon: MessageSquare,
    color: "text-green-500",
    description: "Conecta tu cuenta de WhatsApp Business para recibir y enviar mensajes",
    requirements: [
      "Cuenta de WhatsApp Business verificada",
      "Número de teléfono dedicado",
      "Cuenta de Facebook Business Manager",
      "Token de acceso de WhatsApp Cloud API",
    ],
    fields: [
      { key: "phoneNumber", label: "Número de teléfono", placeholder: "+54 11 1234-5678", required: true },
      { key: "accessToken", label: "Token de acceso", placeholder: "EAAxxxxxxxxxx...", required: true },
      { key: "phoneNumberId", label: "Phone Number ID", placeholder: "123456789012345", required: true },
      { key: "businessName", label: "Nombre del negocio", placeholder: "Mi Empresa", required: false },
    ],
  },
  instagram: {
    name: "Instagram Business",
    icon: Instagram,
    color: "text-pink-500",
    description: "Conecta tu cuenta de Instagram Business para gestionar mensajes directos",
    requirements: [
      "Cuenta de Instagram Business",
      "Página de Facebook vinculada",
      "Cuenta de Facebook Business Manager",
      "Permisos de administrador",
    ],
    fields: [
      { key: "instagramId", label: "Instagram Business ID", placeholder: "123456789", required: true },
      { key: "accessToken", label: "Token de acceso", placeholder: "EAAxxxxxxxxxx...", required: true },
      { key: "username", label: "Nombre de usuario", placeholder: "@miempresa", required: false },
    ],
  },
  facebook: {
    name: "Facebook Messenger",
    icon: Facebook,
    color: "text-blue-500",
    description: "Conecta tu página de Facebook para recibir mensajes de Messenger",
    requirements: [
      "Página de Facebook Business",
      "Cuenta de Facebook Business Manager",
      "Permisos de administrador de página",
      "Messenger habilitado en la página",
    ],
    fields: [
      { key: "pageId", label: "Page ID", placeholder: "123456789012345", required: true },
      { key: "accessToken", label: "Token de acceso", placeholder: "EAAxxxxxxxxxx...", required: true },
      { key: "pageName", label: "Nombre de la página", placeholder: "Mi Empresa", required: false },
    ],
  },
  web: {
    name: "Chat Web",
    icon: Globe,
    color: "text-purple-500",
    description: "Integra un widget de chat en tu sitio web",
    requirements: [
      "Sitio web activo",
      "Acceso para instalar código JavaScript",
      "Dominio verificado",
      "Certificado SSL (HTTPS)",
    ],
    fields: [
      { key: "websiteUrl", label: "URL del sitio web", placeholder: "https://miempresa.com", required: true },
      { key: "widgetName", label: "Nombre del widget", placeholder: "Chat de Soporte", required: false },
      {
        key: "welcomeMessage",
        label: "Mensaje de bienvenida",
        placeholder: "¡Hola! ¿En qué podemos ayudarte?",
        required: false,
      },
    ],
  },
  email: {
    name: "Email",
    icon: Mail,
    color: "text-orange-500",
    description: "Conecta tu cuenta de email para gestionar consultas",
    requirements: [
      "Cuenta de email empresarial",
      "Servidor SMTP configurado",
      "Credenciales de aplicación",
      "Permisos IMAP/POP3",
    ],
    fields: [
      { key: "emailAddress", label: "Dirección de email", placeholder: "soporte@miempresa.com", required: true },
      { key: "smtpServer", label: "Servidor SMTP", placeholder: "smtp.gmail.com", required: true },
      { key: "smtpPort", label: "Puerto SMTP", placeholder: "587", required: true },
      {
        key: "password",
        label: "Contraseña de aplicación",
        placeholder: "••••••••••••••••",
        required: true,
        type: "password",
      },
    ],
  },
}

export function WizardConnectChannel({ open, onOpenChange }: WizardConnectChannelProps) {
  const [step, setStep] = useState<Step>(1)
  const [selectedChannel, setSelectedChannel] = useState<Channel>("whatsapp")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionResult, setConnectionResult] = useState<"success" | "error" | null>(null)
  const { addToast } = useToast()

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as Step)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as Step)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock success/error
    const success = Math.random() > 0.3 // 70% success rate
    setConnectionResult(success ? "success" : "error")
    setIsConnecting(false)

    if (success) {
      addToast({
        type: "success",
        title: "Canal conectado",
        description: `${channelInfo[selectedChannel].name} conectado correctamente`,
      })
    } else {
      addToast({
        type: "error",
        title: "Error de conexión",
        description: "No se pudo conectar el canal. Verifica los datos.",
      })
    }
  }

  const handleTestMessage = async () => {
    setIsConnecting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsConnecting(false)

    addToast({
      type: "success",
      title: "Mensaje de prueba enviado",
      description: "El canal está funcionando correctamente",
    })

    // Close wizard after successful test
    setTimeout(() => {
      onOpenChange(false)
      setStep(1)
      setConnectionResult(null)
      setFormData({})
    }, 1000)
  }

  const handleClose = () => {
    onOpenChange(false)
    setStep(1)
    setConnectionResult(null)
    setFormData({})
  }

  const currentChannel = channelInfo[selectedChannel]
  const Icon = currentChannel.icon

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Conectar Canal - Paso {step} de 3
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stepNum < step ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 3 && <div className={`w-12 h-0.5 ${stepNum < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Select Channel */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Selecciona el canal a conectar</h3>
                <p className="text-muted-foreground">Elige la plataforma que quieres integrar con tu CRM</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(channelInfo).map(([key, info]) => {
                  const ChannelIcon = info.icon
                  return (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedChannel === key ? "ring-2 ring-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedChannel(key as Channel)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <ChannelIcon className={`w-6 h-6 ${info.color} shrink-0 mt-0.5`} />
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{info.name}</h4>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                          </div>
                          {selectedChannel === key && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Requirements & Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${currentChannel.color}`} />
                <div>
                  <h3 className="text-lg font-semibold">{currentChannel.name}</h3>
                  <p className="text-muted-foreground">{currentChannel.description}</p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Requisitos previos
                </h4>
                <div className="space-y-2">
                  {currentChannel.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration Form */}
              <div>
                <h4 className="font-medium mb-3">Configuración</h4>
                <div className="space-y-4">
                  {currentChannel.fields.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={field.key} className="flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id={field.key}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Test Connection */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${currentChannel.color}`} />
                <div>
                  <h3 className="text-lg font-semibold">Probar conexión</h3>
                  <p className="text-muted-foreground">Verificamos que todo esté configurado correctamente</p>
                </div>
              </div>

              {!connectionResult && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className={`w-8 h-8 ${currentChannel.color}`} />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Haz clic en "Conectar" para establecer la conexión con {currentChannel.name}
                  </p>
                  <Button onClick={handleConnect} disabled={isConnecting} className="gap-2">
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Conectar
                      </>
                    )}
                  </Button>
                </div>
              )}

              {connectionResult === "success" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">¡Conexión exitosa!</h4>
                  <p className="text-muted-foreground mb-4">
                    {currentChannel.name} se conectó correctamente. Ahora puedes enviar un mensaje de prueba.
                  </p>
                  <Button onClick={handleTestMessage} disabled={isConnecting} className="gap-2">
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        Enviar mensaje de prueba
                      </>
                    )}
                  </Button>
                </div>
              )}

              {connectionResult === "error" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Error de conexión</h4>
                  <p className="text-muted-foreground mb-4">
                    No se pudo conectar con {currentChannel.name}. Verifica los datos e intenta nuevamente.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setConnectionResult(null)}>
                      Reintentar
                    </Button>
                    <Button variant="outline" onClick={handleBack}>
                      Volver atrás
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={step === 1 ? handleClose : handleBack} disabled={isConnecting}>
              {step === 1 ? (
                "Cancelar"
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </>
              )}
            </Button>

            {step < 3 && (
              <Button onClick={handleNext} className="gap-2">
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {step === 3 && connectionResult === "success" && (
              <Button onClick={handleClose} variant="outline">
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
