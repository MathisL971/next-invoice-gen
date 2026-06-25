import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import InvoiceForm from "@/components/invoices/invoice-form";
import InvoicePreview from "@/components/invoices/invoice-preview";
import ConvertQuoteButton from "@/components/quotes/convert-quote-button";
import DeleteButton from "@/components/invoices/delete-button";
import PageHeader from "@/components/layout/page-header";
import Panel from "@/components/ui/panel";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { getQuoteStatusLabel } from "@/lib/utils/labels";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: quote, error } = await supabase
    .from("invoices")
    .select("*, clients(*), profiles(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("document_type", "quote")
    .single();

  if (error || !quote) redirect("/quotes");

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("order_index");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, reference")
    .eq("user_id", user.id)
    .order("name");

  const totalHT =
    items?.reduce((sum, item) => sum + parseFloat(item.total_ht || "0"), 0) ||
    0;
  const totalTTC = quote.vat_applicable ? totalHT * 1.2 : totalHT;
  const isConverted = Boolean(quote.converted_to_invoice_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote.reference}
        description={`Devis · Version ${quote.version} · Créé le ${formatDate(quote.created_at)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/quotes">
              <Button variant="secondary">Retour aux devis</Button>
            </Link>
            <Link href={`/api/invoices/${id}/pdf`} target="_blank">
              <Button>Télécharger le PDF</Button>
            </Link>
            {!isConverted && <ConvertQuoteButton quoteId={id} />}
            {isConverted && (
              <Link href={`/invoices/${quote.converted_to_invoice_id}`}>
                <Button variant="secondary">Voir la facture</Button>
              </Link>
            )}
            <DeleteButton
              invoiceId={id}
              invoiceReference={quote.reference}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InvoicePreview
          invoice={{ ...quote, document_type: "quote", items: items || [] }}
          totalHT={totalHT}
          totalTTC={totalTTC}
        />

        <div className="space-y-6">
          <Panel accent>
            <h2 className="mb-4 text-lg font-semibold text-[#1a454f] dark:text-teal-50">
              Détails du devis
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">
                  Statut :
                </span>
                <span className="inline-flex rounded-full bg-stone-100 px-2 text-xs font-semibold text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                  {getQuoteStatusLabel(quote.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">
                  Total HT :
                </span>
                <span className="font-semibold text-[#1a454f] dark:text-teal-50">
                  {formatCurrency(totalHT, quote.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">
                  Total TTC :
                </span>
                <span className="font-semibold text-[#1a454f] dark:text-teal-50">
                  {formatCurrency(totalTTC, quote.currency)}
                </span>
              </div>
              {isConverted && (
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Ce devis a été converti en facture.
                </p>
              )}
            </div>
          </Panel>

          {!isConverted && (
            <Panel accent>
              <InvoiceForm
                documentType="quote"
                invoice={{ ...quote, items: items || [] }}
                clients={clients || []}
                defaultCurrency={quote.profiles?.default_currency}
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
