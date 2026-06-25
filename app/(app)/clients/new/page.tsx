import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientForm from '@/components/clients/client-form'
import QuotaReached from '@/components/billing/quota-reached'
import PageHeader from '@/components/layout/page-header'
import Panel from '@/components/ui/panel'
import {
  getCurrentPlan,
  getUsage,
  FREE_CLIENT_LIMIT,
} from '@/lib/billing/entitlements'

export default async function NewClientPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [plan, usage] = await Promise.all([getCurrentPlan(), getUsage()])
  const overQuota = plan.plan === 'free' && usage.clients >= FREE_CLIENT_LIMIT

  // Get the last client number to generate next reference
  const { data: lastClient } = await supabase
    .from('clients')
    .select('reference')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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
      <PageHeader
        title="Nouveau client"
        description="Ajoutez un nouveau client"
      />

      {overQuota ? (
        <QuotaReached
          resource="clients"
          used={usage.clients}
          limit={FREE_CLIENT_LIMIT}
        />
      ) : (
        <Panel accent>
          <ClientForm initialReference={nextReference} />
        </Panel>
      )}
    </div>
  )
}

