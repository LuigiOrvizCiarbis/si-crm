"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, ArrowLeft, ChevronDown, Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { type BillingCycle, billingCycles, plans, comparisonRows, buildCumulativeFeatures } from "@/lib/pricing-data"
import { Fragment } from "react"

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("1mes")
  const [expandAll, setExpandAll] = useState(false)
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          const target = e.target as HTMLElement
          if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
            e.preventDefault()
            setExpandAll((v) => !v)
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  useEffect(() => {
    if (expandAll) {
      setExpandedPlans(new Set(plans.map((p) => p.id)))
    } else {
      setExpandedPlans(new Set())
    }
  }, [expandAll])

  const handleSelectPlan = (planName: string) => {
    toast({
      title: "Plan seleccionado",
      description: `Has seleccionado el plan ${planName}`,
    })
  }

  const toggleExpanded = (planId: string) => {
    setExpandedPlans((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(planId)) {
        newSet.delete(planId)
      } else {
        newSet.add(planId)
      }
      return newSet
    })
  }

  const comparisonSections = [
    {
      title: "Precio",
      rows: [
        {
          name: "Precio mensual",
          values: plans.map((p) => (p.precio !== null ? `U$D ${p.precio}` : "Custom")),
        },
      ],
    },
    {
      title: "Usuarios y Conversaciones",
      rows: comparisonRows.filter((r) => r.section === "Usuarios y Conversaciones"),
    },
    {
      title: "Funcionalidades Principales",
      rows: comparisonRows.filter((r) => r.section === "Funcionalidades Principales"),
    },
    {
      title: "IA & Automatización",
      rows: comparisonRows.filter((r) => r.section === "IA & Automatización"),
    },
    {
      title: "Adicionales",
      rows: comparisonRows.filter((r) => r.section === "Adicionales"),
    },
    {
      title: "Cantidad cuentas por canal",
      rows: comparisonRows.filter((r) => r.section === "Cantidad cuentas por canal"),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with period selector */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-[#1e2533]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link href="/configuracion">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver a Configuración
              </Button>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Período:</span>
              {billingCycles.map((cycle) => (
                <Button
                  key={cycle.value}
                  variant={billingCycle === cycle.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBillingCycle(cycle.value)}
                >
                  {cycle.label}
                </Button>
              ))}
              <span className="text-xs text-muted-foreground ml-2">(descuentos próximamente)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Planes y Precios</h1>
          <p className="text-lg text-muted-foreground">
            Elige el plan que mejor se adapte a las necesidades de tu negocio
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 py-3">
          <Button
            onClick={() => setExpandAll((v) => !v)}
            aria-expanded={expandAll}
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-[#1e2533] px-4 hover:bg-white/5 gap-2"
          >
            {expandAll ? (
              <>
                <Minimize2 className="w-4 h-4" />
                Contraer todo
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Expandir todo
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">Atajo: E</span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-6 gap-6">
          {plans.map((plan) => {
            const features = buildCumulativeFeatures(plan.id)
            const maxVisible = 8
            const isExpanded = expandedPlans.has(plan.id)
            const visibleFeatures = isExpanded ? features : features.slice(0, maxVisible)
            const hasMore = features.length > maxVisible

            return (
              <Card
                key={plan.id}
                className={`rounded-2xl border-[#1e2533] relative flex flex-col h-full ${
                  plan.recommended || plan.bestselling ? "ring-2 ring-primary" : ""
                }`}
              >
                {(plan.recommended || plan.bestselling) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-4">
                      {plan.recommended ? "Recomendado" : "Más vendido"}
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.nombre}</CardTitle>
                  <div className="mt-4">
                    {plan.precio !== null ? (
                      <>
                        <span className="text-4xl font-bold">${plan.precio}</span>
                        <span className="text-muted-foreground"> U$D/mes</span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold">Precio a medida</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <ul className="space-y-2 flex-1">
                    {visibleFeatures.map((feature) => (
                      <li key={feature.key} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="flex-1">
                          {feature.label}
                          {feature.isNew && (
                            <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0">
                              Nuevo
                            </Badge>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {hasMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(plan.id)}
                      className="w-full gap-2"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "Ver menos" : `Ver más (${features.length - maxVisible})`}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </Button>
                  )}

                  <Button
                    className="w-full mt-auto"
                    variant={plan.recommended || plan.bestselling ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.nombre)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Comparación detallada</h2>
          <div className="relative overflow-auto rounded-2xl border border-[#1e2533]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="sticky top-0 z-30 bg-[#0f1420] backdrop-blur border-b-2 border-[#1e2533]">
                  <th className="sticky left-0 z-40 bg-[#0f1420] text-left p-4 font-semibold min-w-[250px] border-r border-[#1e2533]">
                    Características
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="p-4 text-center min-w-[140px] bg-[#0f1420]">
                      <div className="font-bold text-base">{plan.nombre}</div>
                      {(plan.id === "intermediate" || plan.id === "high") && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {plan.id === "intermediate" ? "Recomendado" : "Más vendido"}
                        </Badge>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonSections.map((section, sectionIdx) => (
                  <Fragment key={sectionIdx}>
                    {/* Section title row */}
                    <tr className="bg-white/[0.05]">
                      <td
                        colSpan={plans.length + 1}
                        className="sticky left-0 z-10 p-3 text-xs uppercase tracking-wide text-[#9AA4B2] font-semibold border-y border-[#1e2533]"
                      >
                        {section.title}
                      </td>
                    </tr>
                    {/* Section rows */}
                    {section.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-[#1e2533]/50 hover:bg-white/[0.02] transition-colors">
                        <td className="sticky left-0 z-10 bg-[#0f1420] p-4 text-sm font-medium border-r border-[#1e2533]">
                          {row.name}
                        </td>
                        {row.values.map((value, valueIdx) => (
                          <td key={valueIdx} className="p-4 text-center text-sm align-middle">
                            {value === "—" ? (
                              <X className="w-5 h-5 text-red-400/50 mx-auto" />
                            ) : value === "Sí" ? (
                              <Check className="w-5 h-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="tabular-nums">{value}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center space-y-4 py-8">
          <h3 className="text-2xl font-bold">¿Necesitas ayuda para elegir?</h3>
          <p className="text-muted-foreground">Nuestro equipo está listo para ayudarte a encontrar el plan perfecto</p>
          <Button size="lg" variant="outline">
            Contactar con ventas
          </Button>
        </div>
      </div>
    </div>
  )
}
