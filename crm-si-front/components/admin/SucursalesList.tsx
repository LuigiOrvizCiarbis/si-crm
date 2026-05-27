"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Loader2, Building2, MapPin, Phone, Mail } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { usePermission } from "@/hooks/usePermission"
import { useBranchesStore } from "@/store/useBranchesStore"
import { Branch } from "@/lib/api/branches"
import { SucursalForm } from "./SucursalForm"

export function SucursalesList() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const canManage = usePermission("branches.manage")
  const { branches, loaded, loading, fetch, remove } = useBranchesStore()

  const [editing, setEditing] = useState<Branch | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetch()
  }, [fetch])

  const handleDelete = async (id: number) => {
    const { ok, error } = await remove(id)
    setDeletingId(null)
    if (!ok) {
      toast({ title: t("common.error"), description: error || "", variant: "destructive" })
      return
    }
    toast({ title: t("sucursales.deleted") })
  }

  if (loading && !loaded) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("sucursales.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("sucursales.subtitle")}</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t("sucursales.create")}
          </Button>
        )}
      </div>

      {branches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>{t("sucursales.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{branch.name}</span>
                    {!branch.is_active && (
                      <Badge variant="secondary">{t("sucursales.inactive")}</Badge>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(branch)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeletingId(branch.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {branch.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>{branch.address}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span>{branch.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SucursalForm
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => fetch(true)}
      />
      <SucursalForm
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        branch={editing}
        onSaved={() => fetch(true)}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sucursales.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("sucursales.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
