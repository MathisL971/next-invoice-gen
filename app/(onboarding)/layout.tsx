import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isFiscalSettingsComplete } from "@/lib/finance/cotisations-st-barth";
import type { FiscalSettings } from "@/lib/types/database";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("fiscal_settings")
    .eq("id", user.id)
    .maybeSingle();

  const fiscalSettings = (profile?.fiscal_settings || {}) as FiscalSettings;
  if (isFiscalSettingsComplete(fiscalSettings)) {
    redirect("/dashboard");
  }

  return (
    <div className="app-shell-bg flex min-h-screen items-center justify-center p-4 lg:p-8">
      {children}
    </div>
  );
}
