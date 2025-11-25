export interface Profile {
  id: string
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
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  reference: string
  name: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  reference: string
  version: string
  client_id: string
  client_reference?: string
  invoice_date: string
  due_date: string
  payment_method: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  vat_applicable: boolean
  vat_article?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  additional_info?: string
  unit_price_ht: number
  quantity: number
  total_ht: number
  order_index: number
  created_at: string
}

export interface InvoiceTemplate {
  id: string
  user_id: string
  name: string
  default_payment_method: string
  default_payment_terms: number
  default_vat_settings: {
    vat_applicable: boolean
    vat_article?: string
  }
  is_default: boolean
  created_at: string
  updated_at: string
}

