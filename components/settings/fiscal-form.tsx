"use client";

import { useState } from "react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { ACTIVITY_TYPE_LABELS } from "@/lib/finance/cotisations-st-barth";
import type {
  ActivityType,
  DeclarationFrequency,
  FiscalSettings,
} from "@/lib/types/database";
import type { Profile } from "@/components/settings/profile-types";
import { useProfileUpdate } from "@/components/settings/use-profile-update";

interface FiscalFormProps {
  profile: Profile;
}

export default function FiscalForm({ profile }: FiscalFormProps) {
  const { save, loading, error } = useProfileUpdate();
  const [fiscalSettings, setFiscalSettings] = useState<FiscalSettings>({
    activity_start_date: profile.fiscal_settings?.activity_start_date || "",
    activity_type: profile.fiscal_settings?.activity_type,
    declaration_frequency:
      profile.fiscal_settings?.declaration_frequency || "quarterly",
    versement_liberatoire: profile.fiscal_settings?.versement_liberatoire || false,
    employee_count: profile.fiscal_settings?.employee_count ?? 0,
    is_artisan: profile.fiscal_settings?.is_artisan ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save({ fiscal_settings: fiscalSettings });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card title="Micro-entreprise (CPS St Barth)">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Configurez votre activité pour calculer les cotisations sociales. Les
          taux suivent le barème CPS Saint-Barthélemy (taux DROM réduits).
        </p>
        <div className="space-y-4">
          <Input
            label="Date de début d'activité"
            type="date"
            value={fiscalSettings.activity_start_date || ""}
            onChange={(e) =>
              setFiscalSettings({
                ...fiscalSettings,
                activity_start_date: e.target.value,
              })
            }
          />

          <Select
            label="Type d'activité"
            value={fiscalSettings.activity_type || ""}
            onChange={(e) =>
              setFiscalSettings({
                ...fiscalSettings,
                activity_type: e.target.value as ActivityType,
                is_artisan:
                  e.target.value === "prestations_bic"
                    ? fiscalSettings.is_artisan
                    : false,
              })
            }
            options={[
              { value: "", label: "Sélectionnez un type d'activité…" },
              ...Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />

          <Select
            label="Fréquence de déclaration (DCA)"
            value={fiscalSettings.declaration_frequency || "quarterly"}
            onChange={(e) =>
              setFiscalSettings({
                ...fiscalSettings,
                declaration_frequency: e.target.value as DeclarationFrequency,
              })
            }
            options={[
              { value: "monthly", label: "Mensuelle" },
              { value: "quarterly", label: "Trimestrielle" },
            ]}
          />

          <Input
            label="Nombre de salariés"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={String(fiscalSettings.employee_count ?? 0)}
            onChange={(e) =>
              setFiscalSettings({
                ...fiscalSettings,
                employee_count: parseInt(e.target.value, 10) || 0,
              })
            }
          />
          <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
            Utilisé pour la CFAE (350 € + 100 € par salarié) et le barème TED
            (entrepreneur inclus).
          </p>

          {fiscalSettings.activity_type === "prestations_bic" && (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={fiscalSettings.is_artisan ?? false}
                onChange={(e) =>
                  setFiscalSettings({
                    ...fiscalSettings,
                    is_artisan: e.target.checked,
                  })
                }
                className="rounded border-stone-300 text-teal-700 focus:ring-teal-600 dark:border-stone-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Activité artisanale (barème TED majoré)
              </span>
            </label>
          )}

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={fiscalSettings.versement_liberatoire || false}
              onChange={(e) =>
                setFiscalSettings({
                  ...fiscalSettings,
                  versement_liberatoire: e.target.checked,
                })
              }
              className="rounded border-stone-300 text-teal-700 focus:ring-teal-600 dark:border-stone-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Versement libératoire de l&apos;impôt sur le revenu
            </span>
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
