"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Loader2, X, Mail, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { getInvitations, createInvitation, deleteInvitation, type Invitation } from "@/lib/api/invitations"

export function TeamInvitationsCard() {
  const { toast } = useToast()
  const { t } = useTranslation()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("2") // EMPLOYEE default
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    setLoading(true)
    const data = await getInvitations()
    setInvitations(data)
    setLoading(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    const { data, error } = await createInvitation(email.trim(), parseInt(role))
    setSending(false)

    if (error) {
      toast({ title: t("team.invitationError"), description: error, variant: "destructive" })
      return
    }

    toast({
      title: t("team.invitationSent"),
      description: `${t("team.invitationSentDesc")} ${email}`,
    })
    setEmail("")
    loadInvitations()
  }

  const handleRevoke = async (id: number) => {
    const { error } = await deleteInvitation(id)
    if (error) {
      toast({ title: t("common.error"), description: error, variant: "destructive" })
      return
    }
    toast({ title: t("team.invitationRevoked") })
    loadInvitations()
  }

  const pendingInvitations = invitations.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date())
  const acceptedInvitations = invitations.filter((i) => i.accepted_at)

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {t("team.inviteTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite form */}
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            type="email"
            placeholder={t("team.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={sending}
            className="flex-1"
          />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t("team.roleAdmin")}</SelectItem>
              <SelectItem value="2">{t("team.roleEmployee")}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={sending} size="sm">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("team.sendInvitation")}
          </Button>
        </form>

        {/* Pending invitations */}
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : pendingInvitations.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("team.pendingInvitations")}
            </p>
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {inv.role === 1 ? t("team.roleAdmin") : t("team.roleEmployee")}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t("team.expires")} {new Date(inv.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={() => handleRevoke(inv.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">{t("team.noInvitations")}</p>
        )}

        {/* Accepted invitations */}
        {acceptedInvitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("team.accepted")}
            </p>
            {acceptedInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border opacity-60">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">{inv.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{t("team.accepted")}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
