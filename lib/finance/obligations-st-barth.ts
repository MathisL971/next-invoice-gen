import type { ActivityType, FiscalSettings } from "./types";

export type ObligationType = "cfae" | "ted";

export interface ObligationDefinition {
  type: ObligationType;
  label: string;
  fullName: string;
  description: string;
  paymentUrl: string;
  paymentLabel: string;
  dueMonth: number;
  dueDay: number;
}

export const OBLIGATION_DEFINITIONS: Record<
  ObligationType,
  ObligationDefinition
> = {
  cfae: {
    type: "cfae",
    label: "CFAE",
    fullName: "Contribution Forfaitaire Annuelle des Entreprises",
    description:
      "Due par toute entreprise immatriculée à Saint-Barthélemy. Part fixe de 350 €, plus 100 € par salarié déclaré au 31 décembre.",
    paymentUrl: "https://www.comstbarth.fr",
    paymentLabel: "Payer sur comstbarth.fr",
    dueMonth: 3,
    dueDay: 31,
  },
  ted: {
    type: "ted",
    label: "TED",
    fullName: "Taxe d'Élimination des Déchets",
    description:
      "Taxe annuelle auprès d'Ouanalao Environnement. Montant selon votre activité et effectif (120 € pour les services/bureaux de moins de 2 personnes).",
    paymentUrl: "https://www.ecocito.com",
    paymentLabel: "Payer sur ecocito.com",
    dueMonth: 3,
    dueDay: 31,
  },
};

const CFAE_BASE = 350;
const CFAE_PER_EMPLOYEE = 100;

/** Default TED for service/bureau activities with fewer than 2 employees. */
const TED_SERVICE_DEFAULT = 120;
/** Default TED for commerce/artisan (minimum bracket). */
const TED_COMMERCE_DEFAULT = 390;

export function computeCfaeAmount(employeeCount = 0): number {
  return CFAE_BASE + employeeCount * CFAE_PER_EMPLOYEE;
}

export function computeDefaultTedAmount(
  activityType?: ActivityType
): number {
  if (!activityType) return TED_SERVICE_DEFAULT;

  switch (activityType) {
    case "vente_bic":
      return TED_COMMERCE_DEFAULT;
    case "prestations_bic":
      return TED_COMMERCE_DEFAULT;
    default:
      return TED_SERVICE_DEFAULT;
  }
}

/**
 * CFAE is not due in the creation year if the business started between
 * 1 October and 31 December.
 */
export function isCfaeExemptForYear(
  activityStartDate: string,
  year: number
): boolean {
  const start = new Date(activityStartDate);
  if (start.getFullYear() !== year) return false;
  return start.getMonth() >= 9;
}

export function getObligationDueDate(
  type: ObligationType,
  year: number
): Date {
  const def = OBLIGATION_DEFINITIONS[type];
  return new Date(year, def.dueMonth - 1, def.dueDay, 23, 59, 59, 999);
}

export function getDefaultAmountDue(
  type: ObligationType,
  settings: FiscalSettings
): number {
  if (type === "cfae") {
    return computeCfaeAmount(settings.employee_count ?? 0);
  }
  return computeDefaultTedAmount(settings.activity_type);
}

export function shouldIncludeObligation(
  type: ObligationType,
  settings: FiscalSettings,
  year: number
): boolean {
  if (
    type === "cfae" &&
    settings.activity_start_date &&
    isCfaeExemptForYear(settings.activity_start_date, year)
  ) {
    return false;
  }
  return true;
}

export function getDaysUntilDue(dueDate: Date, now: Date = new Date()): number {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDue = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );
  return Math.ceil(
    (startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getObligationStatus(
  amountDue: number,
  amountPaid: number,
  dueDate: Date,
  now: Date = new Date()
): "paid" | "overdue" | "due_soon" | "upcoming" {
  if (amountDue > 0 && amountPaid >= amountDue) return "paid";

  const days = getDaysUntilDue(dueDate, now);
  if (days < 0) return "overdue";
  if (days <= 30) return "due_soon";
  return "upcoming";
}
