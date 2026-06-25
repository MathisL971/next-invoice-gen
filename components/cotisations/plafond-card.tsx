import { formatCurrency } from "@/lib/utils/format";
import type { PlafondSummary } from "@/lib/finance/plafonds";

interface PlafondCardProps {
  plafond: PlafondSummary;
  currency?: string;
}

const STATUS_STYLES = {
  ok: {
    bar: "bg-teal-600 dark:bg-teal-500",
    text: "text-teal-800 dark:text-teal-200",
  },
  warning: {
    bar: "bg-amber-500 dark:bg-amber-400",
    text: "text-amber-800 dark:text-amber-200",
  },
  critical: {
    bar: "bg-red-500 dark:bg-red-400",
    text: "text-red-800 dark:text-red-200",
  },
} as const;

export default function PlafondCard({
  plafond,
  currency = "EUR",
}: PlafondCardProps) {
  const styles = STATUS_STYLES[plafond.status];
  const percentDisplay = Math.min(100, Math.round(plafond.percentUsed));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            CA {plafond.year} · plafond micro-entreprise
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(plafond.ytdTurnover, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Plafond
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(plafond.ceiling, currency)}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-sm">
          <span className={`font-medium ${styles.text}`}>
            {percentDisplay} % utilisé
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {formatCurrency(plafond.remaining, currency)} restants
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all ${styles.bar}`}
            style={{ width: `${percentDisplay}%` }}
          />
        </div>
      </div>

      {plafond.projectedAnnual !== null && plafond.projectedAnnual > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Projection fin d&apos;année au rythme actuel :{" "}
          <span
            className={
              plafond.projectedAnnual > plafond.ceiling
                ? "font-medium text-red-700 dark:text-red-300"
                : "font-medium text-gray-900 dark:text-white"
            }
          >
            {formatCurrency(plafond.projectedAnnual, currency)}
          </span>
          {plafond.projectedAnnual > plafond.ceiling && (
            <span className="text-red-700 dark:text-red-300">
              {" "}
              — dépassement estimé
            </span>
          )}
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Basé sur le CA HT des factures payées depuis le 1er janvier. Le plafond
        s&apos;applique sur l&apos;année civile, quel que soit le régime fiscal.
      </p>
    </div>
  );
}
