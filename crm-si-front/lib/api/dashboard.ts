import { getAuthToken } from "./auth-token";

export type DashboardPeriodo =
  | "hoy"
  | "esta-semana"
  | "este-mes"
  | "este-trimestre"
  | "este-ano";

export interface DashboardStage {
  id: number;
  name: string;
  sort_order: number;
  count: number;
  value: number;
}

export interface DashboardKpis {
  total_opportunities: number;
  pipeline_value: number;
  weighted_value: number;
  avg_value: number;
  total_conversations: number;
  total_contacts: number;
  won_count: number;
  won_value: number;
  global_conversion_rate: number;
  avg_roi: number;
}

export interface DashboardOmnichannel {
  channel_id: number | null;
  channel_name: string | null;
  channel_type: number | string | null;
  conversations_count: number;
}

export interface DashboardDailyEntry {
  date: string;
  [stageKey: string]: number | string;
}

export interface DashboardMetrics {
  stages: DashboardStage[];
  kpis: DashboardKpis;
  previous: DashboardKpis;
  trends: Record<keyof DashboardKpis, number>;
  daily_series: DashboardDailyEntry[];
  omnichannel: DashboardOmnichannel[];
  range: {
    start: string;
    end: string;
    periodo: DashboardPeriodo;
  };
}

export interface DashboardFilters {
  periodo?: DashboardPeriodo;
  canal?: string | number | null;
  owner?: string | number | null;
}

export class DashboardApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "DashboardApiError";
  }
}

export async function getDashboardMetrics(
  filters: DashboardFilters = {}
): Promise<DashboardMetrics> {
  const token = getAuthToken();

  if (!token) {
    throw new DashboardApiError("No auth token", 401);
  }

  const params = new URLSearchParams();
  if (filters.periodo) params.set("periodo", filters.periodo);
  if (filters.canal !== undefined && filters.canal !== null && filters.canal !== "") {
    params.set("canal", String(filters.canal));
  }
  if (filters.owner !== undefined && filters.owner !== null && filters.owner !== "") {
    params.set("owner", String(filters.owner));
  }

  const qs = params.toString();
  const url = `/api/dashboard/metrics${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new DashboardApiError(
      body?.error || body?.message || `Dashboard request failed (${res.status})`,
      res.status
    );
  }

  return (await res.json()) as DashboardMetrics;
}
