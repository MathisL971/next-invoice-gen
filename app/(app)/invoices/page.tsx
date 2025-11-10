import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import InvoiceActions from "@/components/invoices/invoice-actions";
import { formatDate, formatCurrency } from "@/lib/utils/format";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; client?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("invoices")
    .select(
      "id, reference, invoice_date, due_date, status, client_id, clients(name)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  if (searchParams.client) {
    query = query.eq("client_id", searchParams.client);
  }

  const { data: invoices, error } = await query;

  // Get total amounts for all invoices in one query
  const invoiceTotals: Record<string, number> = {};
  if (invoices && invoices.length > 0) {
    const invoiceIds = invoices.map((inv: { id: string }) => inv.id);
    const { data: allItems } = await supabase
      .from("invoice_items")
      .select("invoice_id, total_ht")
      .in("invoice_id", invoiceIds);

    if (allItems) {
      allItems.forEach((item) => {
        if (!invoiceTotals[item.invoice_id]) {
          invoiceTotals[item.invoice_id] = 0;
        }
        invoiceTotals[item.invoice_id] += parseFloat(item.total_ht || "0");
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your invoices and track payments
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Error loading invoices: {error.message}
          </p>
        </div>
      )}

      {invoices && invoices.length > 0 ? (
        <div className="rounded-lg bg-white dark:bg-zinc-900 shadow">
          <Table
            headers={[
              "Reference",
              "Client",
              "Date",
              "Due Date",
              "Amount",
              "Status",
              "Actions",
            ]}
          >
            {invoices.map((invoice: { id: string; reference: string; invoice_date: string; due_date: string; status: string; client_id: string; clients: { name: string } | { name: string }[] | null }) => {
              const clientName = Array.isArray(invoice.clients) 
                ? invoice.clients[0]?.name 
                : invoice.clients?.name;
              return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.reference}
                </TableCell>
                <TableCell>{clientName || "Unknown"}</TableCell>
                <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                <TableCell>{formatDate(invoice.due_date)}</TableCell>
                <TableCell>
                  {formatCurrency(invoiceTotals[invoice.id] || 0)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                      invoice.status === "paid"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                        : invoice.status === "overdue"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                        : invoice.status === "sent"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </TableCell>
                <TableCell>
                  <InvoiceActions
                    invoiceId={invoice.id}
                    invoiceReference={invoice.reference}
                  />
                </TableCell>
              </TableRow>
            );
            })}
          </Table>
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-zinc-900 p-12 text-center shadow">
          <p className="text-gray-500 dark:text-gray-400">
            No invoices yet. Create your first invoice to get started.
          </p>
        </div>
      )}
    </div>
  );
}
