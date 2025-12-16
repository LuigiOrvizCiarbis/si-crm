"use client"

import { useState } from "react"
import { ChevronDown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const mockAccounts = [
  { id: "1", name: "Empresa Demo", logo: "🏢" },
  { id: "2", name: "Sucursal Norte", logo: "🏪" },
  { id: "3", name: "Sucursal Sur", logo: "🏬" },
]

export function AccountSwitcher() {
  const [activeAccount, setActiveAccount] = useState(mockAccounts[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between gap-2 px-3 py-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-lg">
              {activeAccount.logo}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">{activeAccount.name}</p>
              <p className="text-xs text-muted-foreground">Cuenta activa</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 z-[100]" sideOffset={5} modal={true}>
        <DropdownMenuLabel>Cambiar cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockAccounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => setActiveAccount(account)}
            className={activeAccount.id === account.id ? "bg-accent" : ""}
          >
            <span className="mr-3 text-lg">{account.logo}</span>
            {account.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Building2 className="mr-2 h-4 w-4" />
          Administrar cuentas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
