'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

interface Client {
  id?: string
  reference: string
  name: string
  address?: string
}

interface ClientFormProps {
  client?: Client
  initialReference?: string
}

export default function ClientForm({ client, initialReference }: ClientFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const initialFormData = useMemo(() => ({
    reference: client?.reference || initialReference || '',
    name: client?.name || '',
    address: client?.address || '',
  }), [client, initialReference])
  
  const [formData, setFormData] = useState<Client>(initialFormData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      toast.error('You must be logged in')
      setLoading(false)
      return
    }

    if (client?.id) {
      // Update existing client
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id)
        .eq('user_id', user.id)

      if (updateError) {
        setError(updateError.message)
        toast.error('Failed to update client', {
          description: updateError.message,
        })
        setLoading(false)
      } else {
        toast.success('Client updated successfully')
        router.refresh()
      }
    } else {
      // Create new client - use database function to generate reference
      const { data: refData, error: refError } = await supabase.rpc(
        'generate_client_reference',
        { p_user_id: user.id }
      )

      if (refError) {
        setError(refError.message)
        toast.error('Failed to generate client reference', {
          description: refError.message,
        })
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          reference: refData,
          name: formData.name,
          address: formData.address || null,
        })

      if (insertError) {
        setError(insertError.message)
        toast.error('Failed to create client', {
          description: insertError.message,
        })
        setLoading(false)
      } else {
        toast.success('Client created successfully')
        router.push('/clients')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Input
        label="Reference"
        value={formData.reference}
        disabled
        className="bg-gray-50 dark:bg-zinc-800"
      />

      <Input
        label="Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
        </Button>
        {client && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/clients')}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

