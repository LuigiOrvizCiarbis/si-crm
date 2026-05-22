"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield } from "lucide-react"
import { RolesList } from "@/components/admin/RolesList"
import { UsersRoleList } from "@/components/admin/UsersRoleList"
import { useTranslation } from "@/hooks/useTranslation"
import { usePermission } from "@/hooks/usePermission"

export function RolesCard() {
  const { t } = useTranslation()
  const allowed = usePermission(["roles.view", "roles.manage"])

  if (!allowed) return null

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t("roles.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("roles.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="roles" className="w-full">
          <TabsList>
            <TabsTrigger value="roles">{t("roles.tabs.roles")}</TabsTrigger>
            <TabsTrigger value="users">{t("roles.tabs.users")}</TabsTrigger>
          </TabsList>
          <TabsContent value="roles" className="pt-6">
            <RolesList />
          </TabsContent>
          <TabsContent value="users" className="pt-6">
            <UsersRoleList />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
