'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/button'

interface StatusToggleProps {
  invoiceId: string
  currentStatus: string
}

export default function StatusToggle({ invoiceId, currentStatus }: StatusToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update status')
      }

      const statusLabels: Record<string, string> = {
        paid: 'paid',
        unpaid: 'unpaid',
        sent: 'sent',
        draft: 'draft',
      }
      
      toast.success(`Invoice marked as ${statusLabels[newStatus] || newStatus}`)
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      console.error('Error updating status:', error)
      toast.error('Failed to update invoice status', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== 'paid' && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => updateStatus('paid')}
          disabled={loading}
        >
          Mark as Paid
        </Button>
      )}
      {currentStatus === 'paid' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus('unpaid')}
          disabled={loading}
        >
          Mark as Unpaid
        </Button>
      )}
      {currentStatus === 'draft' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus('sent')}
          disabled={loading}
        >
          Mark as Sent
        </Button>
      )}
    </div>
  )
}

