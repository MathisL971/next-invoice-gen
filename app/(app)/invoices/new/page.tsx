import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvoiceForm from "@/components/invoices/invoice-form";
import QuotaReached from "@/components/billing/quota-reached";
import PageHeader from "@/components/layout/page-header";
import Panel from "@/components/ui/panel";
import {
  getCurrentPlan,
  getUsage,
  FREE_INVOICE_LIMIT_PER_MONTH,
} from "@/lib/billing/entitlements";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load entitlements, clients, and profile in parallel
  const [plan, usage, clientsResult, profileResult] = await Promise.all([
    getCurrentPlan(),
    getUsage(),
    supabase
      .from("clients")
      .select("id, name, reference")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("profiles")
      .select("default_currency")
      .eq("id", user.id)
      .single(),
  ]);

  const overQuota =
    plan.plan === "free" &&
    usage.invoicesThisMonth >= FREE_INVOICE_LIMIT_PER_MONTH;

  const clients = clientsResult.data;
  const profile = profileResult.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle facture"
        description="Créez une nouvelle facture pour votre client"
      />

      {overQuota ? (
        <QuotaReached
          resource="invoices"
          used={usage.invoicesThisMonth}
          limit={FREE_INVOICE_LIMIT_PER_MONTH}
        />
      ) : (
        <Panel accent>
          <InvoiceForm
            clients={clients || []}
            defaultCurrency={profile?.default_currency}
          />
        </Panel>
      )}
    </div>
  );
}
