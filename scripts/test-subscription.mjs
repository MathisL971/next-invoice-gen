/**
 * Subscription module smoke tests (local dev).
 * Usage: NEXT_PUBLIC_APP_URL=http://localhost:3002 node scripts/test-subscription.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
const email = 'lefrancmathis@gmail.com'

if (!url || !anonKey || !serviceKey) {
  console.error('Missing Supabase env vars in .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const results = []

function pass(name, detail) {
  results.push({ name, ok: true, detail })
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail) {
  results.push({ name, ok: false, detail })
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

async function fetchOtpFromMailpit() {
  for (let i = 0; i < 20; i++) {
    const res = await fetch('http://127.0.0.1:55424/api/v1/messages')
    const data = await res.json()
    const msg = data.messages?.find((m) => m.To?.some((t) => t.Address === email))
    if (msg) {
      const full = await fetch(`http://127.0.0.1:55424/api/v1/message/${msg.ID}`).then((r) =>
        r.json()
      )
      const body = full.Text || full.HTML || ''
      const match = body.match(/\b(\d{6})\b/)
      if (match) return match[1]
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('OTP not found in Mailpit — request a code on /login first')
}

function createCookieClient() {
  /** @type {{ name: string; value: string; options?: Record<string, unknown> }[]} */
  const jar = []
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return jar
      },
      setAll(cookiesToSet) {
        for (const c of cookiesToSet) {
          const idx = jar.findIndex((x) => x.name === c.name)
          if (c.value) {
            const entry = { name: c.name, value: c.value, options: c.options }
            if (idx >= 0) jar[idx] = entry
            else jar.push(entry)
          } else if (idx >= 0) {
            jar.splice(idx, 1)
          }
        }
      },
    },
  })
  return {
    client,
    cookieHeader() {
      return jar.map((c) => `${c.name}=${c.value}`).join('; ')
    },
  }
}

async function login() {
  const { client, cookieHeader } = createCookieClient()
  const { error: otpErr } = await client.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (otpErr) throw new Error(otpErr.message)

  const otp = await fetchOtpFromMailpit()
  const { error } = await client.auth.verifyOtp({ email, token: otp, type: 'email' })
  if (error) throw new Error(error.message)

  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('No user after login')

  return { userId: user.id, cookie: cookieHeader() }
}

async function setupFreeTierWithInvoiceQuota(userId) {
  const { data: existing } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, plan, status')
    .eq('user_id', userId)
    .maybeSingle()

  // Never wipe a live Stripe subscription — sync from Stripe instead.
  if (existing?.stripe_subscription_id) {
    console.log('Skipping free-tier reset — active Stripe subscription detected.')
    return false
  }

  await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: 'free',
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      cancel_at_period_end: false,
    },
    { onConflict: 'user_id' }
  )

  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const { count } = await admin
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const needed = 3 - (count ?? 0)
  if (needed <= 0) return

  const { data: client } = await admin
    .from('clients')
    .select('id, reference')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (!client) throw new Error('No client found for test user')

  for (let i = 0; i < needed; i++) {
    const { data: ref } = await admin.rpc('generate_invoice_reference', { p_user_id: userId })
    await admin.from('invoices').insert({
      user_id: userId,
      reference: ref,
      client_id: client.id,
      client_reference: client.reference,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      payment_method: 'Virement',
      status: 'draft',
      vat_applicable: false,
    })
  }
}

async function main() {
  console.log(`App URL: ${appUrl}`)
  console.log('Logging in…')
  const { userId, cookie } = await login()

  console.log('Preparing free-tier quota state…')
  const quotaTestReady = await setupFreeTierWithInvoiceQuota(userId)

  const { data: sampleInvoice } = await admin
    .from('invoices')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sampleInvoice) throw new Error('No invoice available for duplicate test')

  if (quotaTestReady === false) {
    pass('quota tests skipped', 'user has active Stripe subscription')
  } else {
  {
    const res = await fetch(`${appUrl}/api/invoices/${sampleInvoice.id}/duplicate`, {
      method: 'POST',
      headers: { Cookie: cookie },
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 403 && data.error === 'quota_exceeded') {
      pass('duplicate invoice blocked at quota')
    } else {
      fail('duplicate invoice blocked at quota', `got ${res.status} ${JSON.stringify(data)}`)
    }
  }

  {
    const res = await fetch(`${appUrl}/settings/billing`, { headers: { Cookie: cookie } })
    const html = await res.text()
    if (res.ok && html.includes('Abonnement') && html.includes('Utilisation ce mois-ci')) {
      pass('billing page loads for authenticated user')
    } else {
      fail('billing page loads for authenticated user', `status ${res.status}`)
    }
  }

  {
    const res = await fetch(`${appUrl}/settings/billing?status=success`, {
      headers: { Cookie: cookie },
    })
    if (res.ok) pass('checkout success redirect page reachable')
    else fail('checkout success redirect page reachable', `status ${res.status}`)
  }

  {
    const res = await fetch(`${appUrl}/invoices/new`, { headers: { Cookie: cookie } })
    const html = await res.text()
    if (res.ok && html.includes('Limite de la formule gratuite atteinte')) {
      pass('invoice new page shows quota reached')
    } else {
      fail('invoice new page shows quota reached', `status ${res.status}`)
    }
  }

  {
    const { count } = await admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if ((count ?? 0) >= 1) {
      const res = await fetch(`${appUrl}/api/clients`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Quota Test Client' }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 403 && data.error === 'quota_exceeded') {
        pass('client create blocked at quota')
      } else {
        fail('client create blocked at quota', `got ${res.status} ${JSON.stringify(data)}`)
      }
    } else {
      pass('client create blocked at quota', 'skipped — user has 0 clients')
    }
  }
  }

  {
    const res = await fetch(`${appUrl}/api/stripe/webhook`, {
      method: 'POST',
      body: '{}',
      redirect: 'manual',
    })
    if (res.status === 400) pass('webhook rejects missing signature')
    else fail('webhook rejects missing signature', `status ${res.status}`)
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
