"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useConfigStore } from "@/store/useConfigStore"
import { Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function RolesCard() {
  const { billing, users, updateUserRole } = useConfigStore()
  const { toast } = useToast()

  const isAvailable = ["intermediate", "high", "agency", "enterprise"].includes(billing.actual)

  const handleRoleChange = (userId: string, role: "admin" | "vendedor") => {
    updateUserRole(userId, role)
    toast({
      title: "Rol actualizado",
      description: "El rol del usuario se actualizó correctamente",
    })
  }

  if (!isAvailable) {
    return (
      <Card className="rounded-2xl border-[#1e2533]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Badge variant="outline" className="mb-4">
              Disponible desde Intermediate
            </Badge>
            <p className="text-sm text-muted-foreground mb-4">
              La gestión de roles está disponible desde el plan Intermediate en adelante
            </p>
            <Button variant="outline">Actualizar plan</Button>
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
          Roles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">Admin</Badge>
            <span className="text-sm text-muted-foreground">Acceso total + gestión de vendedores</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Vendedor</Badge>
            <span className="text-sm text-muted-foreground">Acceso solo a sus canales, contactos y tareas</span>
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
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
