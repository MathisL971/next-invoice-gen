import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get stats
  const { count: invoiceCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true });

  const { count: clientCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });

  const { data: recentInvoices } = await supabase
    .from("invoices")
    .select("id, reference, invoice_date, status, client_id, clients(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back! Here&apos;s an overview of your invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white dark:bg-zinc-900 p-6 shadow">
          <div className="flex items-center">
            <div className="shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-500 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Invoices
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {invoiceCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white dark:bg-zinc-900 p-6 shadow">
          <div className="flex items-center">
            <div className="shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Clients
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {clientCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {recentInvoices && recentInvoices.length > 0 && (
        <div className="rounded-lg bg-white dark:bg-zinc-900 shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Invoices
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentInvoices.map((invoice: { id: string; reference: string; invoice_date: string; status: string; client_id: string; clients: { name: string } | { name: string }[] | null }) => {
              const clientName = Array.isArray(invoice.clients) 
                ? invoice.clients[0]?.name 
                : invoice.clients?.name;
              return (
              <div
                key={invoice.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.reference}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {clientName || "Unknown Client"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                          : invoice.status === "overdue"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
