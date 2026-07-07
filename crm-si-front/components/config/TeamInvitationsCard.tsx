"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Loader2, X, Mail, Clock } from "lucide-react"
import { useToast } from "@/components/Toast"
import { useTranslation } from "@/hooks/useTranslation"
import { getInvitations, createInvitation, deleteInvitation, type Invitation } from "@/lib/api/invitations"
import { getRoles, type Role } from "@/lib/api/roles"

export function TeamInvitationsCard() {
  const { addToast } = useToast()
  const { t } = useTranslation()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [email, setEmail] = useState("")
  const [roleName, setRoleName] = useState<string>("Admin")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvitations()
    loadRoles()
  }, [])

  const loadInvitations = async () => {
    setLoading(true)
    const data = await getInvitations()
    setInvitations(data)
    setLoading(false)
  }

  const loadRoles = async () => {
    const data = await getRoles()
    setRoles(data)
    const fallback = data.find((r) => r.name === "Admin") ?? data[0]
    if (fallback) {
      setRoleName(fallback.name)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    const { error } = await createInvitation(email.trim(), roleName)
    setSending(false)

    if (error) {
      addToast({ title: t("team.invitationError"), description: error, type: "error" })
      return
    }

    addToast({
      type: "success",
      title: t("team.invitationSent"),
      description: `${t("team.invitationSentDesc")} ${email}`,
    })
    setEmail("")
    loadInvitations()
  }

  const handleRevoke = async (id: number) => {
    const { error } = await deleteInvitation(id)
    if (error) {
      addToast({ title: t("common.error"), description: error, type: "error" })
      return
    }
    addToast({ type: "success", title: t("team.invitationRevoked") })
    loadInvitations()
  }

  const pendingInvitations = invitations.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date())
  const acceptedInvitations = invitations.filter((i) => i.accepted_at)

  const getInitial = (email: string) => email.trim().charAt(0).toUpperCase() || "?"

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {t("team.inviteTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite form */}
        <form onSubmit={handleSend} className="space-y-2">
          <Input
            type="email"
            placeholder={t("team.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={sending}
            className="w-full"
          />
          <div className="flex gap-2">
            <Select value={roleName} onValueChange={setRoleName}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              disabled={sending || roles.length === 0}
              className="shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("team.sendInvitation")}
            </Button>
          </div>
        </form>

        {/* Pending invitations */}
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : pendingInvitations.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("team.pendingInvitations")}
            </p>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                    {getInitial(inv.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs font-normal">
                        {inv.role_name}
                      </Badge>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {t("team.expires")} {new Date(inv.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRevoke(inv.id)}
                    aria-label={t("team.invitationRevoked")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">{t("team.noInvitations")}</p>
        )}

        {/* Accepted invitations */}
        {acceptedInvitations.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("team.accepted")}
            </p>
            <div className="space-y-2">
              {acceptedInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground text-sm font-semibold shrink-0">
                    {getInitial(inv.email)}
                  </div>
                  <p className="flex-1 min-w-0 text-sm truncate">{inv.email}</p>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {t("team.accepted")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
