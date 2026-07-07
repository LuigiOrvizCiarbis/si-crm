"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User as UserIcon } from "lucide-react"
import { useToast } from "@/components/Toast"
import { useTranslation } from "@/hooks/useTranslation"
import { getUsers, type SystemUser } from "@/lib/api/users"
import { assignUserRole, getRoles, type Role } from "@/lib/api/roles"
import { useAuthStore } from "@/store/useAuthStore"
import { useIsOwner, usePermission } from "@/hooks/usePermission"

export function UsersRoleList() {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const currentUser = useAuthStore((s) => s.user)
  const canAssign = usePermission("users.assign_role")
  const isOwner = useIsOwner()

  const [users, setUsers] = useState<SystemUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const [u, r] = await Promise.all([getUsers(), getRoles()])
    setUsers(u)
    setRoles(r)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = async (userId: number, roleName: string) => {
    setSavingUserId(userId)
    const { error } = await assignUserRole(userId, roleName)
    setSavingUserId(null)

    if (error) {
      addToast({ title: t("roles.assignError"), description: error, type: "error" })
      return
    }
    addToast({ type: "success", title: t("roles.assignSuccess") })
    load()
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t("roles.assignTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("roles.assignSubtitle")}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("roles.noUsers")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isCurrent = u.id === currentUser?.id
            const targetIsOwner = u.role?.is_owner === true
            // Only Owner can change another Owner's role.
            const disabled = !canAssign || (targetIsOwner && !isOwner) || isCurrent
            return (
              <Card key={u.id} className="border-border">
                <CardContent className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{u.name}</p>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            {t("settings.you") || "Tú"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {savingUserId === u.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Select
                      value={u.role?.name ?? ""}
                      onValueChange={(v) => handleChange(u.id, v)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.name}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
