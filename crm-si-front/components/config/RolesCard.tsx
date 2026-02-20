"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useConfigStore } from "@/store/useConfigStore"
import { Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

export function RolesCard() {
  const { billing, users, updateUserRole } = useConfigStore()
  const { toast } = useToast()
  const { t } = useTranslation()

  const isAvailable = ["intermediate", "high", "agency", "enterprise"].includes(billing.actual)

  const handleRoleChange = (userId: string, role: "admin" | "vendedor") => {
    updateUserRole(userId, role)
    toast({
      title: t("settings.roleUpdated"),
      description: t("settings.roleUpdatedDesc"),
    })
  }

  if (!isAvailable) {
    return (
      <Card className="rounded-2xl border-[#1e2533]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("settings.roles")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Badge variant="outline" className="mb-4">
              {t("settings.availableFrom")}
            </Badge>
            <p className="text-sm text-muted-foreground mb-4">
              {t("settings.rolesUpsell")}
            </p>
            <Button variant="outline">{t("settings.upgradePlan")}</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t("settings.roles")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">{t("settings.adminRole")}</Badge>
            <span className="text-sm text-muted-foreground">{t("settings.adminRoleDesc")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t("settings.sellerRole")}</Badge>
            <span className="text-sm text-muted-foreground">{t("settings.sellerRoleDesc")}</span>
          </div>
        </div>

        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e2533]">
            <div>
              <p className="font-medium">{user.nombre}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Select
              value={user.role}
              onValueChange={(value) => handleRoleChange(user.id, value as "admin" | "vendedor")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("settings.adminRole")}</SelectItem>
                <SelectItem value="vendedor">{t("settings.sellerRole")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
