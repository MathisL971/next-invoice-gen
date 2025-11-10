import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/button'
import { Table, TableRow, TableCell } from '@/components/ui/table'
import { formatDate } from '@/lib/utils/format'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: templates, error } = await supabase
    .from('invoice_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Invoice Templates
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage reusable invoice templates
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Error loading templates: {error.message}
          </p>
        </div>
      )}

      {templates && templates.length > 0 ? (
        <div className="rounded-lg bg-white dark:bg-zinc-900 shadow">
          <Table headers={['Name', 'Payment Method', 'Payment Terms', 'Default', 'Created', 'Actions']}>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.default_payment_method}</TableCell>
                <TableCell>{template.default_payment_terms} days</TableCell>
                <TableCell>
                  {template.is_default ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      Yes
                    </span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(template.created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/invoices/new?template=${template.id}`}>
                      <Button variant="ghost" size="sm">
                        Use
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-zinc-900 p-12 text-center shadow">
          <p className="text-gray-500 dark:text-gray-400">
            No templates yet. Create templates from existing invoices to speed up your workflow.
          </p>
        </div>
      )}
    </div>
  )
}

