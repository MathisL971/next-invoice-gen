import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientForm from '@/components/clients/client-form'

export default async function NewClientPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the last client number to generate next reference
  const { data: lastClient } = await supabase
    .from('clients')
    .select('reference')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let nextReference = 'C-000001'
  if (lastClient?.reference) {
    const match = lastClient.reference.match(/C-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      nextReference = `C-${String(num + 1).padStart(6, '0')}`
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          New Client
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add a new client to your system
        </p>
      </div>

      <ClientForm initialReference={nextReference} />
    </div>
  )
}

