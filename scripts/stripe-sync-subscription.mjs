/**
 * Re-sync subscription state from Stripe into Supabase.
 * Usage: node scripts/stripe-sync-subscription.mjs [email]
 */
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => /^[^#=]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const email = process.argv[2] || 'lefrancmathis@gmail.com'
const key = env.STRIPE_SECRET_KEY
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!key || !url || !serviceKey) {
  console.error('Missing STRIPE_SECRET_KEY or Supabase env vars in .env.local')
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const ACTIVE = new Set(['active', 'trialing', 'past_due'])

function periodEndIso(sub) {
  const ts = sub.items?.data?.[0]?.current_period_end
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null
}

const { data: userData, error: userErr } = await admin.auth.admin.listUsers()
if (userErr) {
  console.error(userErr.message)
  process.exit(1)
}
const user = userData.users.find((u) => u.email === email)
if (!user) {
  console.error(`No auth user for ${email}`)
  process.exit(1)
}

const customers = await stripe.customers.list({ email, limit: 5 })
const customer = customers.data[0]
if (!customer) {
  console.error(`No Stripe customer for ${email}`)
  process.exit(1)
}

const subs = await stripe.subscriptions.list({
  customer: customer.id,
  status: 'all',
  limit: 10,
})

const sub =
  subs.data.find((s) => ACTIVE.has(s.status)) ??
  subs.data.sort((a, b) => b.created - a.created)[0]

if (!sub) {
  console.error(`No subscription found for customer ${customer.id}`)
  process.exit(1)
}

const isActive = ACTIVE.has(sub.status)
const priceId = sub.items?.data?.[0]?.price?.id ?? null

const row = {
  user_id: user.id,
  stripe_customer_id: customer.id,
  stripe_subscription_id: sub.id,
  stripe_price_id: priceId,
  plan: isActive ? 'pro' : 'free',
  status: sub.status,
  current_period_end: periodEndIso(sub),
  cancel_at_period_end: sub.cancel_at_period_end ?? false,
}

const { error } = await admin.from('subscriptions').upsert(row, { onConflict: 'user_id' })
if (error) {
  console.error(error.message)
  process.exit(1)
}

console.log(`Synced ${email}:`)
console.log(`  plan=${row.plan} status=${row.status}`)
console.log(`  customer=${row.stripe_customer_id}`)
console.log(`  subscription=${row.stripe_subscription_id}`)
console.log(`  renews=${row.current_period_end}`)
