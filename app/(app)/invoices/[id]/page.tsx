import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import InvoiceForm from "@/components/invoices/invoice-form";
import InvoicePreview from "@/components/invoices/invoice-preview";
import StatusToggle from "@/components/invoices/status-toggle";
import DuplicateButton from "@/components/invoices/duplicate-button";
import DeleteButton from "@/components/invoices/delete-button";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { isOverdue } from "@/lib/utils/invoice-status";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, clients(*), profiles(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !invoice) {
    redirect("/invoices");
  }

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
  const totalTTC = invoice.vat_applicable ? totalHT * 1.2 : totalHT;

  // Check if invoice is overdue and update status if needed
  const overdue = isOverdue(invoice.due_date, invoice.status);
  if (overdue && invoice.status !== "paid" && invoice.status !== "overdue") {
    // Update status to overdue in background (non-blocking)
    supabase
      .from("invoices")
      .update({ status: "overdue" })
      .eq("id", id)
      .eq("user_id", user.id)
      .then(() => {});
  }

  const displayStatus =
    overdue && invoice.status !== "paid" ? "overdue" : invoice.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {invoice.reference}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Version {invoice.version} • Created {formatDate(invoice.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/invoices">
            <Button variant="secondary">Back to Invoices</Button>
          </Link>
          <Link href={`/api/invoices/${id}/pdf`} target="_blank">
            <Button>Download PDF</Button>
          </Link>
          <DuplicateButton invoiceId={id} />
          <DeleteButton invoiceId={id} invoiceReference={invoice.reference} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <InvoicePreview
            invoice={{
              ...invoice,
              items: items || [],
            }}
            totalHT={totalHT}
            totalTTC={totalTTC}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-white dark:bg-zinc-900 p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invoice Details
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                      displayStatus === "paid"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                        : displayStatus === "overdue"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                        : displayStatus === "sent"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {displayStatus}
                  </span>
                </div>
              </div>
              <StatusToggle invoiceId={id} currentStatus={displayStatus} />
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Total HT:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totalHT)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Total TTC:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totalTTC)}
                </span>
              </div>
            </div>
          </div>

          <InvoiceForm
            invoice={{ ...invoice, items: items || [] }}
            clients={clients || []}
          />
        </div>
      </div>
    </div>
  );
}
