"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useConfigStore } from "@/store/useConfigStore"
import { useState } from "react"
import { User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

export function ProfileCard() {
  const { profile, updateProfile } = useConfigStore()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [accountType, setAccountType] = useState(profile.accountType)
  const [formData, setFormData] = useState(profile)

  const handleSave = () => {
    updateProfile(formData)
    toast({
      title: t("settings.profileSaved"),
      description: t("settings.profileSavedDesc"),
    })
  }

  const handleTypeChange = (type: "persona" | "empresa") => {
    setAccountType(type)
    setFormData({ ...formData, accountType: type })
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {t("settings.profile")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("settings.accountType")}</Label>
          <div className="flex gap-2">
            <Button
              variant={accountType === "persona" ? "default" : "outline"}
              onClick={() => handleTypeChange("persona")}
              className="flex-1"
            >
              {t("settings.individual")}
            </Button>
            <Button
              variant={accountType === "empresa" ? "default" : "outline"}
              onClick={() => handleTypeChange("empresa")}
              className="flex-1"
            >
              {t("settings.company")}
            </Button>
          </div>
        </div>

        {accountType === "persona" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="nombre">{t("settings.fullName")}</Label>
              <Input
                id="nombre"
                value={formData.persona?.nombre || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    persona: { ...formData.persona, nombre: e.target.value },
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                value={formData.persona?.dni || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    persona: { ...formData.persona, dni: e.target.value },
                  })
                }
                placeholder="12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apodo">{t("settings.username")}</Label>
              <Input
                id="apodo"
                value={formData.persona?.apodo || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    persona: { ...formData.persona, apodo: e.target.value },
                  })
                }
                placeholder="@usuario"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="razonSocial">{t("settings.companyName")}</Label>
              <Input
                id="razonSocial"
                value={formData.empresa?.razonSocial || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    empresa: { ...formData.empresa, razonSocial: e.target.value },
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuit">{t("settings.taxId")}</Label>
              <Input
                id="cuit"
                value={formData.empresa?.cuit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    empresa: { ...formData.empresa, cuit: e.target.value },
                  })
                }
                placeholder="20-12345678-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fantasia">{t("settings.tradeName")}</Label>
              <Input
                id="fantasia"
                value={formData.empresa?.fantasia || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    empresa: { ...formData.empresa, fantasia: e.target.value },
                  })
                }
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.comunes.email || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                comunes: { ...formData.comunes, email: e.target.value },
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">{t("settings.website")}</Label>
          <Input
            id="website"
            value={formData.comunes.website || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                comunes: { ...formData.comunes, website: e.target.value },
              })
            }
            placeholder="https://ejemplo.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={formData.comunes.contacto?.whatsapp || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  comunes: {
                    ...formData.comunes,
                    contacto: { ...formData.comunes.contacto, whatsapp: e.target.value },
                  },
                })
              }
              placeholder="+54 9 11 1234-5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              value={formData.comunes.contacto?.telegram || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  comunes: {
                    ...formData.comunes,
                    contacto: { ...formData.comunes.contacto, telegram: e.target.value },
                  },
                })
              }
              placeholder="@usuario"
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          {t("settings.save")}
        </Button>
      </CardContent>
    </Card>
  )
}
