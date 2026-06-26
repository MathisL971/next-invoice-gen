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
      "Taxe annuelle auprès d'Ouanalao Environnement. Services/bureaux : 120 € (<2 pers.), 180 € (2–10), 240 € (>10). Artisans/commerce : 390 € (<2 pers.), 585 € (2–10), 780 € (>10).",
    paymentUrl:
      "https://ouanalaoenvironement.ecocito.com/Usager/Profil/Connexion?ReturnUrl=/Usager/Accueil",
    paymentLabel: "Payer sur Ouanalao Environnement",
    dueMonth: 3,
    dueDay: 31,
  },
};

const CFAE_BASE = 350;
const CFAE_PER_EMPLOYEE = 100;

/** TED brackets by total headcount (entrepreneur + salariés). */
const TED_BUREAU_BRACKETS = [120, 180, 240] as const;
const TED_ARTISAN_COMMERCE_BRACKETS = [390, 585, 780] as const;

export function computeCfaeAmount(employeeCount = 0): number {
  return CFAE_BASE + employeeCount * CFAE_PER_EMPLOYEE;
}

function computeTedFromBrackets(
  employeeCount: number,
  brackets: readonly [number, number, number]
): number {
  const headcount = employeeCount + 1;
  if (headcount < 2) return brackets[0];
  if (headcount <= 10) return brackets[1];
  return brackets[2];
}

function usesArtisanCommerceTedBracket(
  activityType?: ActivityType,
  isArtisan?: boolean
): boolean {
  if (activityType === "vente_bic") return true;
  if (activityType === "prestations_bic" && isArtisan) return true;
  return false;
}

export function computeDefaultTedAmount(
  activityType?: ActivityType,
  employeeCount = 0,
  isArtisan = false
): number {
  const brackets = usesArtisanCommerceTedBracket(activityType, isArtisan)
    ? TED_ARTISAN_COMMERCE_BRACKETS
    : TED_BUREAU_BRACKETS;

  return computeTedFromBrackets(employeeCount, brackets);
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
  return computeDefaultTedAmount(
    settings.activity_type,
    settings.employee_count ?? 0,
    settings.is_artisan ?? false
  );
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
