"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DollarSign, AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  plan: string
  amount: number
  nextPayment: string
  status: "paid" | "pending" | "overdue"
  avatar?: string
  lastPayment: string
}

const clients: Client[] = [
  {
    id: "1",
    name: "María González",
    email: "maria@empresa.com",
    plan: "Plan Pro",
    amount: 299,
    nextPayment: "2024-01-15",
    status: "paid",
    lastPayment: "2023-12-15",
  },
  {
    id: "2",
    name: "Carlos Rodríguez",
    email: "carlos@startup.com",
    plan: "Plan Básico",
    amount: 99,
    nextPayment: "2024-01-10",
    status: "pending",
    lastPayment: "2023-12-10",
  },
  {
    id: "3",
    name: "Ana Martínez",
    email: "ana@corporativo.com",
    plan: "Plan Enterprise",
    amount: 599,
    nextPayment: "2024-01-05",
    status: "overdue",
    lastPayment: "2023-11-05",
  },
  {
    id: "4",
    name: "Roberto Silva",
    email: "roberto@pyme.com",
    plan: "Plan Pro",
    amount: 299,
    nextPayment: "2024-01-20",
    status: "paid",
    lastPayment: "2023-12-20",
  },
]

interface ClientManagementProps {
  searchTerm?: string
  statusFilter?: string
  showNewPaymentDialog?: boolean
  onCloseDialog?: () => void
}

function getStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pagado
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      )
    case "overdue":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Vencido
        </Badge>
      )
    default:
      return <Badge variant="outline">Desconocido</Badge>
  }
}

export function ClientManagement({
  searchTerm: externalSearchTerm = "",
  statusFilter: externalStatusFilter = "all",
  showNewPaymentDialog = false,
  onCloseDialog,
}: ClientManagementProps = {}) {
  const searchTerm = externalSearchTerm
  const statusFilter = externalStatusFilter
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setDialogOpen(showNewPaymentDialog)
  }, [showNewPaymentDialog])

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open && onCloseDialog) {
      onCloseDialog()
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = clients.reduce((sum, client) => sum + client.amount, 0)
  const paidClients = clients.filter((c) => c.status === "paid").length
  const pendingClients = clients.filter((c) => c.status === "pending").length
  const overdueClients = clients.filter((c) => c.status === "overdue").length

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos al Día</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidClients}</div>
            <p className="text-xs text-muted-foreground">Clientes activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClients}</div>
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueClients}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Gestión de Clientes</CardTitle>
              <CardDescription>Administra pagos y suscripciones de tus clientes</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="hidden">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Pago
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Pago</DialogTitle>
                  <DialogDescription>Registra manualmente un pago de cliente</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client">Cliente</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" placeholder="299.00" />
                  </div>
                  <div>
                    <Label htmlFor="date">Fecha de Pago</Label>
                    <Input id="date" type="date" />
                  </div>
                  <Button className="w-full">Registrar Pago</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Lista de clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={client.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{client.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{client.plan}</span>
                      <span className="font-semibold">${client.amount}</span>
                    </div>

                    <div className="flex justify-center">{getStatusBadge(client.status)}</div>

                    <div className="text-center space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Próximo: {new Date(client.nextPayment).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Último: {new Date(client.lastPayment).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
