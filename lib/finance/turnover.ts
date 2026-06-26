import { createClient } from "@/lib/supabase/server";
import {
  convertAmountsToBaseCurrency,
  FISCAL_BASE_CURRENCY,
} from "./currency";
import { computeCotisations, getApplicableRate } from "./cotisations-st-barth";
import {
  getCurrentDeclarationPeriod,
  getYearToDateRange,
  isDateInPeriod,
} from "./periods";
import type { FiscalSettings, PeriodSummary } from "./types";

export interface PaidInvoiceWithTotal {
  id: string;
  reference: string;
  invoice_date: string;
  total_ht: number;
  total_ht_base: number;
  currency?: string;
}

async function fetchPaidInvoicesWithTotals(
  userId: string
): Promise<PaidInvoiceWithTotal[]> {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, reference, invoice_date, currency")
    .eq("user_id", userId)
    .eq("document_type", "invoice")
    .eq("status", "paid");

  if (!invoices?.length) return [];

  const invoiceIds = invoices.map((inv) => inv.id);
  const { data: items } = await supabase
    .from("invoice_items")
    .select("invoice_id, total_ht")
    .in("invoice_id", invoiceIds);

  const totals: Record<string, number> = {};
  items?.forEach((item) => {
    totals[item.invoice_id] =
      (totals[item.invoice_id] || 0) + parseFloat(String(item.total_ht || 0));
  });

  const rawInvoices = invoices.map((inv) => ({
    id: inv.id,
    reference: inv.reference,
    invoice_date: inv.invoice_date,
    total_ht: totals[inv.id] || 0,
    currency: inv.currency,
  }));

  return convertAmountsToBaseCurrency(rawInvoices, FISCAL_BASE_CURRENCY);
}

function sumTurnoverInRange(
  invoices: PaidInvoiceWithTotal[],
  startDate: Date,
  endDate: Date
): { turnover: number; invoiceCount: number } {
  const filtered = invoices.filter((inv) => {
    const date = new Date(inv.invoice_date);
    return date >= startDate && date <= endDate;
  });

  return {
    turnover: filtered.reduce((sum, inv) => sum + inv.total_ht_base, 0),
    invoiceCount: filtered.length,
  };
}

export async function getCotisationSummary(
  userId: string,
  settings: FiscalSettings
) {
  const invoices = await fetchPaidInvoicesWithTotals(userId);
  const frequency = settings.declaration_frequency || "quarterly";
  const currentPeriod = getCurrentDeclarationPeriod(frequency);
  const ytdRange = getYearToDateRange();

  const periodData = sumTurnoverInRange(
    invoices,
    currentPeriod.startDate,
    currentPeriod.endDate
  );
  const ytdData = sumTurnoverInRange(
    invoices,
    ytdRange.startDate,
    ytdRange.endDate
  );

  const rate = getApplicableRate(settings);
  const periodCotisations = computeCotisations(periodData.turnover, settings);
  const ytdCotisations = computeCotisations(ytdData.turnover, settings);

  const periodSummary: PeriodSummary = {
    periodKey: currentPeriod.key,
    label: currentPeriod.label,
    startDate: currentPeriod.startDate,
    endDate: currentPeriod.endDate,
    turnover: periodData.turnover,
    cotisationsDue: periodCotisations,
    rate,
    invoiceCount: periodData.invoiceCount,
  };

  const periodInvoices = invoices
    .filter((inv) => isDateInPeriod(inv.invoice_date, currentPeriod))
    .map((inv) => ({
      ...inv,
      reserveAmount: computeCotisations(inv.total_ht_base, settings),
    }));

  return {
    periodSummary,
    ytdTurnover: ytdData.turnover,
    ytdCotisations,
    rate,
    periodInvoices,
    allPaidInvoices: invoices,
  };
}
