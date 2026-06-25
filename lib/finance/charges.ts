import { computeCotisations } from "./cotisations-st-barth";
import {
  computeCfaeAmount,
  computeDefaultTedAmount,
  shouldIncludeObligation,
} from "./obligations-st-barth";
import type { FiscalSettings } from "./types";

export interface ChargeLine {
  key: string;
  label: string;
  amount: number;
}

export interface ChargesSummary {
  periodLabel: string;
  cpsSocial: number;
  incomeTaxVL: number;
  cpsTotal: number;
  cfaeProrata: number;
  tedProrata: number;
  territorialTotal: number;
  total: number;
  lines: ChargeLine[];
}

export function computePeriodCharges(
  settings: FiscalSettings,
  periodTurnover: number,
  periodLabel: string,
  year: number = new Date().getFullYear()
): ChargesSummary {
  const frequency = settings.declaration_frequency || "quarterly";
  const periodsPerYear = frequency === "monthly" ? 12 : 4;

  const cpsSocial = computeCotisations(periodTurnover, {
    ...settings,
    versement_liberatoire: false,
  });
  const cpsTotal = computeCotisations(periodTurnover, settings);
  const incomeTaxVL = settings.versement_liberatoire
    ? Math.round((cpsTotal - cpsSocial) * 100) / 100
    : 0;

  const cfaeProrata = shouldIncludeObligation("cfae", settings, year)
    ? Math.round(
        (computeCfaeAmount(settings.employee_count ?? 0) / periodsPerYear) *
          100
      ) / 100
    : 0;

  const tedProrata = shouldIncludeObligation("ted", settings, year)
    ? Math.round(
        (computeDefaultTedAmount(settings.activity_type) / periodsPerYear) *
          100
      ) / 100
    : 0;

  const territorialTotal = cfaeProrata + tedProrata;
  const total =
    Math.round((cpsTotal + territorialTotal) * 100) / 100;

  const lines: ChargeLine[] = [
    { key: "cps", label: "Cotisations CPS", amount: cpsSocial },
  ];

  if (incomeTaxVL > 0) {
    lines.push({
      key: "ir",
      label: "Impôt (versement libératoire)",
      amount: incomeTaxVL,
    });
  }

  if (cfaeProrata > 0) {
    lines.push({ key: "cfae", label: "CFAE (prorata période)", amount: cfaeProrata });
  }

  if (tedProrata > 0) {
    lines.push({ key: "ted", label: "TED (prorata période)", amount: tedProrata });
  }

  return {
    periodLabel,
    cpsSocial,
    incomeTaxVL,
    cpsTotal,
    cfaeProrata,
    tedProrata,
    territorialTotal,
    total,
    lines,
  };
}
