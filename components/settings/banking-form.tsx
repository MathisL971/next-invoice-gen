"use client";

import { useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import type { Profile } from "@/components/settings/profile-types";
import { useProfileUpdate } from "@/components/settings/use-profile-update";

interface BankingFormProps {
  profile: Profile;
}

export default function BankingForm({ profile }: BankingFormProps) {
  const { save, loading, error } = useProfileUpdate();
  const [bankingInfo, setBankingInfo] = useState({
    bank_name: profile.banking_info?.bank_name || "",
    RIB: profile.banking_info?.RIB || "",
    IBAN: profile.banking_info?.IBAN || "",
    BIC: profile.banking_info?.BIC || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save({ banking_info: bankingInfo });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card title="Coordonnées bancaires">
        <div className="space-y-4">
          <Input
            label="Nom de la banque"
            value={bankingInfo.bank_name}
            onChange={(e) =>
              setBankingInfo({ ...bankingInfo, bank_name: e.target.value })
            }
          />

          <Input
            label="RIB"
            value={bankingInfo.RIB}
            onChange={(e) =>
              setBankingInfo({ ...bankingInfo, RIB: e.target.value })
            }
          />

          <Input
            label="IBAN"
            value={bankingInfo.IBAN}
            onChange={(e) =>
              setBankingInfo({ ...bankingInfo, IBAN: e.target.value })
            }
          />

          <Input
            label="BIC"
            value={bankingInfo.BIC}
            onChange={(e) =>
              setBankingInfo({ ...bankingInfo, BIC: e.target.value })
            }
          />
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
