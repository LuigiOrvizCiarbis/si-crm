"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  DashboardFilters,
  DashboardMetrics,
  getDashboardMetrics,
} from "@/lib/api/dashboard"

interface UseDashboardMetricsResult {
  data: DashboardMetrics | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useDashboardMetrics(filters: DashboardFilters): UseDashboardMetricsResult {
  const [data, setData] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const fetchMetrics = useCallback(async (): Promise<void> => {
    const currentId = ++requestId.current
    setIsLoading(true)
    setError(null)

    try {
      const metrics = await getDashboardMetrics(filters)
      if (requestId.current === currentId) {
        setData(metrics)
      }
    } catch (e) {
      if (requestId.current === currentId) {
        setError(e instanceof Error ? e.message : "Error desconocido")
      }
    } finally {
      if (requestId.current === currentId) {
        setIsLoading(false)
      }
    }
  }, [filters])

  useEffect(() => {
    void fetchMetrics()
  }, [fetchMetrics])

  return { data, isLoading, error, refresh: fetchMetrics }
}
