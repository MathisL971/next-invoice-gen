'use client'

import { formatDate, formatCurrency, formatNumber } from '@/lib/utils/format'
import Card from '@/components/ui/card'

interface InvoiceItem {
  description: string
  additional_info?: string
  unit_price_ht: number
  quantity: number
  total_ht: number
}

interface Invoice {
  reference: string
  version: string
  invoice_date: string
  due_date: string
  payment_method: string
  vat_applicable: boolean
  vat_article?: string
  notes?: string
  client_reference?: string
  clients?: {
    name: string
    address?: string
  }
  profiles?: {
    company_name?: string
    address?: string
    phone?: string
    email?: string
    banking_info?: {
      bank_name?: string
      RIB?: string
      IBAN?: string
      BIC?: string
    }
  }
  items: InvoiceItem[]
}

interface InvoicePreviewProps {
  invoice: Invoice
  totalHT: number
  totalTTC: number
}

export default function InvoicePreview({
  invoice,
  totalHT,
  totalTTC,
}: InvoicePreviewProps) {
  const sender = invoice.profiles
  const client = invoice.clients

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            {sender?.company_name && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {sender.company_name}
              </h2>
            )}
            {sender?.address && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {sender.address}
              </p>
            )}
            {sender?.phone && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tél.: {sender.phone}
              </p>
            )}
            {sender?.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sender.email}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                FACTURE
              </h1>
            </div>
            <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Référence: {invoice.reference}</p>
              <p>Version: {invoice.version}</p>
              <p>Date de facturation: {formatDate(invoice.invoice_date)}</p>
              {invoice.client_reference && (
                <p>Référence client: {invoice.client_reference}</p>
              )}
            </div>
          </div>
        </div>

        {/* Client Info */}
        {client && (
          <div className="mt-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              {client.name}
            </h3>
            {client.address && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {client.address}
              </p>
            )}
          </div>
        )}

        {/* Line Items Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Prix Unit. HT
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Quantité
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    <div>{item.description}</div>
                    {item.additional_info && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.additional_info}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.unit_price_ht)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.total_ht)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total HT:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalHT)}
              </span>
            </div>
            {invoice.vat_applicable && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">TVA (20%):</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totalTTC - totalHT)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-white">Total Net TTC:</span>
              <span className="text-gray-900 dark:text-white">
                {formatCurrency(totalTTC)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-gray-900 dark:text-white">Net à payer:</span>
              <span className="text-gray-900 dark:text-white">
                {formatCurrency(totalTTC)}
              </span>
            </div>
          </div>
        </div>

        {/* VAT Info */}
        {!invoice.vat_applicable && invoice.vat_article && (
          <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
            TVA non applicable, {invoice.vat_article}
          </div>
        )}

        {/* Payment Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Informations Bancaires
            </h4>
            {sender?.banking_info && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {sender.banking_info.bank_name && (
                  <p>Banque: {sender.banking_info.bank_name}</p>
                )}
                {sender.banking_info.RIB && <p>RIB: {sender.banking_info.RIB}</p>}
                {sender.banking_info.IBAN && <p>IBAN: {sender.banking_info.IBAN}</p>}
                {sender.banking_info.BIC && <p>BIC: {sender.banking_info.BIC}</p>}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Date d&apos;échéance: {formatDate(invoice.due_date)}</p>
              <p>Mode de paiement: {invoice.payment_method}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-right text-xs text-gray-500 dark:text-gray-400">
          Prestation de service
        </div>
      </div>
    </Card>
  )
}

