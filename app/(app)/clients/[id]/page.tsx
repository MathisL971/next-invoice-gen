import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import { formatDate } from '@/lib/utils/format'
import ClientForm from '@/components/clients/client-form'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !client) {
    redirect('/clients')
  }

  // Get invoices for this client
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, reference, invoice_date, status, due_date')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {client.name}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Reference: {client.reference}
          </p>
        </div>
        <Link href="/clients">
          <Button variant="secondary">Back to Clients</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Client Information">
          <ClientForm client={client} />
        </Card>

        {invoices && invoices.length > 0 && (
          <Card title="Invoices">
            <div className="space-y-2">
              {invoices.map((invoice: { id: string; reference: string; invoice_date: string; status: string; due_date: string }) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="block rounded-md border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invoice.reference}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.invoice_date)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 text-xs font-semibold ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

