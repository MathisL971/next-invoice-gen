import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoiceForm from '@/components/invoices/invoice-form'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Load clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, reference')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          New Invoice
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new invoice for your client
        </p>
      </div>

      <InvoiceForm clients={clients || []} />
    </div>
  )
}

