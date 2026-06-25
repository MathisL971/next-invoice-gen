import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import SettingsTabs from "@/components/settings/settings-tabs";
import CompanyForm from "@/components/settings/company-form";
import BankingForm from "@/components/settings/banking-form";
import LegalForm from "@/components/settings/legal-form";
import FiscalForm from "@/components/settings/fiscal-form";
import type { Profile } from "@/components/settings/profile-types";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { tab } = await searchParams;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email || "",
      })
      .select()
      .maybeSingle();

    profile = newProfile ?? {
      id: user.id,
      email: user.email || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (insertError && !newProfile) {
      console.error("Failed to create profile:", insertError.message);
    }
  }

  const profileData = profile as Profile;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez les informations de votre entreprise et votre fiscalité."
      />

      <Suspense
        fallback={
          <div className="h-12 animate-pulse rounded-xl bg-teal-900/5 dark:bg-teal-500/10" />
        }
      >
        <SettingsTabs
          defaultTab={tab}
          entreprise={<CompanyForm profile={profileData} />}
          banque={<BankingForm profile={profileData} />}
          legal={<LegalForm profile={profileData} />}
          fiscal={<FiscalForm profile={profileData} />}
        />
      </Suspense>
    </div>
  );
}
