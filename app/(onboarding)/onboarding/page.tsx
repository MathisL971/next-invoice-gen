import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FiscalWizard from "@/components/onboarding/fiscal-wizard";
import type { FiscalSettings } from "@/lib/types/database";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("fiscal_settings")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <FiscalWizard
      userId={user.id}
      email={user.email}
      initialSettings={(profile?.fiscal_settings || {}) as FiscalSettings}
    />
  );
}
