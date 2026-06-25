import type { DeclarationFrequency } from "./types";

export interface DeclarationPeriod {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function getMonthlyPeriod(date: Date): DeclarationPeriod {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    key: `${year}-${pad(month + 1)}`,
    label: `${MONTH_NAMES[month]} ${year}`,
    startDate,
    endDate,
  };
}

export function getQuarterlyPeriod(date: Date): DeclarationPeriod {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);

  const quarterLabels = ["T1", "T2", "T3", "T4"];

  return {
    key: `${year}-Q${quarter}`,
    label: `${quarterLabels[quarter - 1]} ${year}`,
    startDate,
    endDate,
  };
}

export function getCurrentDeclarationPeriod(
  frequency: DeclarationFrequency,
  date: Date = new Date()
): DeclarationPeriod {
  return frequency === "monthly"
    ? getMonthlyPeriod(date)
    : getQuarterlyPeriod(date);
}

export function getYearToDateRange(date: Date = new Date()): {
  startDate: Date;
  endDate: Date;
} {
  return {
    startDate: new Date(date.getFullYear(), 0, 1),
    endDate: new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999),
  };
}

export function isDateInPeriod(
  dateStr: string,
  period: DeclarationPeriod
): boolean {
  const date = new Date(dateStr);
  return date >= period.startDate && date <= period.endDate;
}
