/**
 * Check if an invoice is overdue based on due_date
 */
export function isOverdue(dueDate: string | Date, status: string): boolean {
  if (status === 'paid') return false
  
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  
  return due < today
}

/**
 * Update invoice status based on payment and due date
 */
export function calculateInvoiceStatus(
  dueDate: string | Date,
  currentStatus: string,
  isPaid: boolean
): string {
  if (isPaid) return 'paid'
  if (currentStatus === 'paid') return 'paid'
  
  if (isOverdue(dueDate, currentStatus)) {
    return 'overdue'
  }
  
  if (currentStatus === 'draft') return 'draft'
  return 'sent'
}

