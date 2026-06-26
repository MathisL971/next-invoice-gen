import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import ReserveTracker from "@/components/cotisations/reserve-tracker";
import ObligationTracker from "@/components/cotisations/obligation-tracker";
import PlafondCard from "@/components/cotisations/plafond-card";
import DeclarationTracker from "@/components/cotisations/declaration-tracker";
import CotisationsTabs from "@/components/cotisations/cotisations-tabs";
import PageHeader from "@/components/layout/page-header";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  ACTIVITY_TYPE_LABELS,
  getActivityPeriod,
  isFiscalSettingsComplete,
  PERIOD_LABELS,
} from "@/lib/finance/cotisations-st-barth";
import { getCotisationSummary } from "@/lib/finance/turnover";
import { getObligationSummary } from "@/lib/finance/obligations";
import { getPlafondSummary } from "@/lib/finance/plafonds";
import { buildDeclarationSummary } from "@/lib/finance/declarations";
import { computePeriodCharges } from "@/lib/finance/charges";
import { FISCAL_BASE_CURRENCY } from "@/lib/finance/currency";
import type { FiscalSettings } from "@/lib/types/database";
import TotalChargesCard from "@/components/cotisations/total-charges-card";

function TabBadge({ children, variant }: { children: React.ReactNode; variant: "warning" | "danger" }) {
  const styles =
    variant === "danger"
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200";

  return (
    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${styles}`}>
      {children}
    </span>
  );
}

export default async function CotisationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("fiscal_settings")
    .eq("id", user.id)
    .single();

  const fiscalSettings = (profile?.fiscal_settings || {}) as FiscalSettings;
  const fiscalCurrency = FISCAL_BASE_CURRENCY;

  if (!isFiscalSettingsComplete(fiscalSettings)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Cotisations"
          description="Suivez vos cotisations sociales de micro-entrepreneur à Saint-Barthélemy."
        />

        <Card title="Configuration requise">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Pour calculer vos cotisations, configurez votre micro-entreprise :
            date de début d&apos;activité, type d&apos;activité et fréquence de
            déclaration (mensuelle ou trimestrielle).
          </p>
          <Link href="/settings?tab=fiscal">
            <Button>Aller aux paramètres</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const summary = await getCotisationSummary(user.id, fiscalSettings);
  const obligationSummary = await getObligationSummary(user.id, fiscalSettings);
  const plafond = getPlafondSummary(
    fiscalSettings.activity_type,
    summary.ytdTurnover
  );

  const { data: reserve } = await supabase
    .from("cotisation_reserves")
    .select("*")
    .eq("user_id", user.id)
    .eq("period_key", summary.periodSummary.periodKey)
    .maybeSingle();

  const activityPeriod = getActivityPeriod(
    new Date(fiscalSettings.activity_start_date)
  );
  const frequencyLabel =
    fiscalSettings.declaration_frequency === "monthly"
      ? "Mensuelle"
      : "Trimestrielle";

  const declaration = buildDeclarationSummary(
    fiscalSettings,
    summary.periodSummary,
    reserve?.declared_at
  );
  const charges = computePeriodCharges(
    fiscalSettings,
    summary.periodSummary.turnover,
    summary.periodSummary.label
  );

  const declarationStatus = reserve?.declared_at ? "declared" : declaration.status;
  const cpsBadge =
    declarationStatus === "overdue" ? (
      <TabBadge variant="danger">!</TabBadge>
    ) : declarationStatus === "due_soon" ? (
      <TabBadge variant="warning">!</TabBadge>
    ) : undefined;

  const pendingObligations = obligationSummary.obligations.filter(
    (o) => o.status === "overdue" || o.status === "due_soon"
  ).length;
  const obligationsBadge =
    pendingObligations > 0 ? (
      <TabBadge variant={obligationSummary.obligations.some((o) => o.status === "overdue") ? "danger" : "warning"}>
        {pendingObligations}
      </TabBadge>
    ) : undefined;

  const deadlineLabel = declaration.deadline.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotisations"
        description={
          <>
            Cotisations CPS et obligations territoriales pour votre
            micro-entreprise à Saint-Barthélemy. Déclarez votre CA via le{" "}
            <a
              href="https://cps-stbarth.msa.fr/lfp/declarer-chiffre-affaires"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 underline decoration-teal-700/30 underline-offset-2 hover:decoration-teal-700 dark:text-teal-300"
            >
              service DCA de la CPS
            </a>
            .
          </>
        }
      />

      <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-teal-900/5 dark:bg-teal-500/10" />}>
        <CotisationsTabs
          cpsBadge={cpsBadge}
          obligationsBadge={obligationsBadge}
          overview={
            <>
              <Card title="Charges totales à provisionner">
                <TotalChargesCard
                  charges={charges}
                  periodTurnover={summary.periodSummary.turnover}
                  currency={fiscalCurrency}
                />
              </Card>

              <Card title={`Plafond CA ${plafond.year}`}>
                <PlafondCard plafond={plafond} currency={fiscalCurrency} />
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Période en cours">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {summary.periodSummary.label}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(summary.periodSummary.cotisationsDue, fiscalCurrency)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        sur {formatCurrency(summary.periodSummary.turnover, fiscalCurrency)} de CA
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        {summary.periodSummary.invoiceCount} facture
                        {summary.periodSummary.invoiceCount !== 1 ? "s" : ""} payée
                        {summary.periodSummary.invoiceCount !== 1 ? "s" : ""} · Taux{" "}
                        {summary.rate}%
                      </p>
                      <p>
                        Échéance DCA : {deadlineLabel}
                        {!declaration.declaredAt &&
                          declaration.daysUntilDeadline >= 0 && (
                            <span> · J-{declaration.daysUntilDeadline}</span>
                          )}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card title="Depuis le début de l'année">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date().getFullYear()}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(summary.ytdCotisations, fiscalCurrency)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        sur {formatCurrency(summary.ytdTurnover, fiscalCurrency)} de CA
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(plafond.percentUsed)} % du plafond (
                        {formatCurrency(plafond.remaining, fiscalCurrency)} restants)
                      </p>
                    </div>
                  </div>
                </Card>

                <Card title="Votre régime">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">Activité</dt>
                      <dd className="text-gray-900 dark:text-white text-right">
                        {ACTIVITY_TYPE_LABELS[fiscalSettings.activity_type]}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">Déclaration</dt>
                      <dd className="text-gray-900 dark:text-white">{frequencyLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Période tarifaire
                      </dt>
                      <dd className="text-gray-900 dark:text-white text-right">
                        Période {activityPeriod}
                      </dd>
                    </div>
                    {fiscalSettings.versement_liberatoire && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500 dark:text-gray-400">Impôt</dt>
                        <dd className="text-gray-900 dark:text-white">
                          Versement libératoire
                        </dd>
                      </div>
                    )}
                  </dl>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {PERIOD_LABELS[activityPeriod]}
                  </p>
                </Card>
              </div>
            </>
          }
          cps={
            <>
              <Card title="Déclaration CPS">
                <DeclarationTracker
                  declaration={declaration}
                  initialReserve={reserve}
                  currency={fiscalCurrency}
                />
              </Card>

              <Card title="Suivi des provisions CPS">
                <ReserveTracker
                  periodKey={summary.periodSummary.periodKey}
                  periodLabel={summary.periodSummary.label}
                  cotisationsDue={summary.periodSummary.cotisationsDue}
                  initialReserve={reserve}
                  currency={fiscalCurrency}
                />
              </Card>

              {summary.periodInvoices.length > 0 ? (
                <Card title="Factures payées sur la période">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Facture
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            CA HT
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Provision
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {summary.periodInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="px-4 py-3 text-sm">
                              <Link
                                href={`/invoices/${inv.id}`}
                                className="text-teal-700 hover:underline font-medium dark:text-teal-300"
                              >
                                {inv.reference}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(inv.invoice_date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                              {formatCurrency(inv.total_ht, inv.currency || fiscalCurrency)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-amber-700 dark:text-amber-300">
                              {formatCurrency(inv.reserveAmount, fiscalCurrency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 dark:bg-zinc-800">
                          <td
                            colSpan={2}
                            className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            Total
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency(summary.periodSummary.turnover, fiscalCurrency)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-amber-700 dark:text-amber-300">
                            {formatCurrency(
                              summary.periodSummary.cotisationsDue,
                              fiscalCurrency
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Montants basés sur la date de facture des factures payées. Les
                    factures en devise étrangère sont converties en {fiscalCurrency} au
                    taux du jour de facturation. Aucune cotisation n&apos;est due si
                    votre CA est nul sur la période.
                  </p>
                </Card>
              ) : (
                <Card>
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Aucune facture payée sur {summary.periodSummary.label}. Marquez vos
                    factures comme payées pour suivre les cotisations de cette période.
                  </p>
                </Card>
              )}
            </>
          }
          obligations={
            <Card title={`Obligations territoriales ${obligationSummary.year}`}>
              <ObligationTracker
                obligations={obligationSummary.obligations}
                year={obligationSummary.year}
                currency={fiscalCurrency}
              />
            </Card>
          }
        />
      </Suspense>
    </div>
  );
}
