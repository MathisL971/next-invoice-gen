import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvoiceForm from "@/components/invoices/invoice-form";
import PageHeader from "@/components/layout/page-header";
import Panel from "@/components/ui/panel";

export default async function NewQuotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [clientsResult, profileResult] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau devis"
        description="Créez un devis à envoyer à votre client avant facturation"
      />

      <Panel accent>
        <InvoiceForm
          documentType="quote"
          clients={clientsResult.data || []}
          defaultCurrency={profileResult.data?.default_currency}
        />
      </Panel>
    </div>
  );
}
