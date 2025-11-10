'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/button'
import DeleteButton from '@/components/invoices/delete-button'

interface InvoiceActionsProps {
  invoiceId: string
  invoiceReference: string
}

export default function InvoiceActions({
  invoiceId,
  invoiceReference,
}: InvoiceActionsProps) {
  const router = useRouter()

  return (
    <div className="flex gap-2">
      <Link href={`/invoices/${invoiceId}`}>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </Link>
      <Link href={`/api/invoices/${invoiceId}/pdf`} target="_blank">
        <Button variant="ghost" size="sm">
          PDF
        </Button>
      </Link>
      <DeleteButton
        invoiceId={invoiceId}
        invoiceReference={invoiceReference}
        variant="ghost"
        size="sm"
        onDeleted={() => {
          router.refresh()
        }}
      />
    </div>
  )
}

