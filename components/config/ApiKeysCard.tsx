"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useConfigStore } from "@/store/useConfigStore"
import { Key, Copy, Trash2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ApiKeysCard() {
  const { apiKeys, generateApiKey, revokeApiKey } = useConfigStore()
  const { toast } = useToast()

  const handleGenerate = (env: "live" | "test") => {
    generateApiKey(env)
    toast({
      title: "API Key generada",
      description: `Se generó una nueva ${env === "live" ? "Production" : "Development"} API Key`,
    })
  }

  const handleCopy = (masked: string) => {
    navigator.clipboard.writeText(masked)
    toast({
      title: "Copiado",
      description: "La API Key se copió al portapapeles",
    })
  }

  const handleRevoke = (id: string) => {
    revokeApiKey(id)
    toast({
      title: "API Key revocada",
      description: "La API Key se revocó correctamente",
      variant: "destructive",
    })
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Keys
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleGenerate("live")} className="flex-1">
            Generar Production Key
          </Button>
          <Button variant="outline" onClick={() => handleGenerate("test")} className="flex-1">
            Generar Development Key
          </Button>
        </div>

        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e2533]">
              <div>
                <p className="font-medium font-mono text-sm">{key.masked}</p>
                <p className="text-xs text-muted-foreground">
                  {key.env === "live" ? "Production" : "Development"} · Creada {key.createdAt}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleCopy(key.masked)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(key.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="link" className="w-full" asChild>
          <a href="/docs" target="_blank" rel="noreferrer">
            📚 Documentación de API
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
