import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale/fr'

/**
 * Format date in French format (DD/MM/YYYY)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd/MM/yyyy', { locale: fr })
}

/**
 * Format number in French format (comma for decimals, space for thousands)
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0,00'
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0,00'
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Format currency in French format (€)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0,00 €'
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0,00 €'
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Generate invoice reference (F-000067 format)
 */
export function generateInvoiceReference(lastNumber: number): string {
  const nextNumber = lastNumber + 1
  return `F-${String(nextNumber).padStart(6, '0')}`
}

/**
 * Generate client reference (C-000001 format)
 */
export function generateClientReference(lastNumber: number): string {
  const nextNumber = lastNumber + 1
  return `C-${String(nextNumber).padStart(6, '0')}`
}

/**
 * Parse invoice reference to get number
 */
export function parseInvoiceReference(ref: string): number {
  const match = ref.match(/F-(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Parse client reference to get number
 */
export function parseClientReference(ref: string): number {
  const match = ref.match(/C-(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

