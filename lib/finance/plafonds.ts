import type { ActivityType } from "./types";

/**
 * Micro-entreprise turnover ceilings (France / DROM, 2025–2026).
 * Source: Code général des impôts, art. 50-0.
 */
const PLAFONDS: Record<ActivityType, number> = {
  vente_bic: 188_700,
  prestations_bic: 77_700,
  prestations_bnc: 77_700,
  location_meublee: 188_700,
};

export type PlafondStatus = "ok" | "warning" | "critical";

export interface PlafondSummary {
  year: number;
  activityType: ActivityType;
  ceiling: number;
  ytdTurnover: number;
  percentUsed: number;
  remaining: number;
  status: PlafondStatus;
  projectedAnnual: number | null;
}

export function getPlafondForActivity(activityType: ActivityType): number {
  return PLAFONDS[activityType];
}

function getPlafondStatus(percentUsed: number): PlafondStatus {
  if (percentUsed >= 95) return "critical";
  if (percentUsed >= 80) return "warning";
  return "ok";
}

export function getPlafondSummary(
  activityType: ActivityType,
  ytdTurnover: number,
  year: number = new Date().getFullYear(),
  now: Date = new Date()
): PlafondSummary {
  const ceiling = getPlafondForActivity(activityType);
  const percentUsed =
    ceiling > 0 ? Math.min(100, (ytdTurnover / ceiling) * 100) : 0;
  const remaining = Math.max(0, ceiling - ytdTurnover);

  const monthIndex = now.getFullYear() === year ? now.getMonth() + 1 : 12;
  const projectedAnnual =
    monthIndex > 0 && ytdTurnover > 0
      ? Math.round((ytdTurnover / monthIndex) * 12 * 100) / 100
      : null;

  return {
    year,
    activityType,
    ceiling,
    ytdTurnover,
    percentUsed,
    remaining,
    status: getPlafondStatus(percentUsed),
    projectedAnnual,
  };
}
