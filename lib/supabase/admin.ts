import { createClient } from '@supabase/supabase-js'

// Service-role client. Bypasses RLS — only import from server-only code paths
// (Stripe webhook handler, billing API routes that need to write subscriptions).
// NEVER import this from a client component.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}
