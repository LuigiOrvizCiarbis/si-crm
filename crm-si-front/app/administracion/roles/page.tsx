"use client"

import { SidebarLayout } from "@/components/SidebarLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RolesList } from "@/components/admin/RolesList"
import { UsersRoleList } from "@/components/admin/UsersRoleList"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { useTranslation } from "@/hooks/useTranslation"

export default function RolesPage() {
  const { t } = useTranslation()

  return (
    <SidebarLayout>
      <RequirePermission perm={["roles.view", "roles.manage"]}>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("roles.title")}</h2>
            <p className="text-muted-foreground">{t("roles.subtitle")}</p>
          </div>

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
        </div>
      </RequirePermission>
    </SidebarLayout>
  )
}
