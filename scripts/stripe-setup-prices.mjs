/**
 * Create Pro product + monthly/yearly prices in Stripe (test mode).
 * Reads STRIPE_SECRET_KEY from .env.local and writes price IDs back.
 * Usage: node scripts/stripe-setup-prices.mjs
 */
import Stripe from 'stripe'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const key = env.STRIPE_SECRET_KEY
if (!key) {
  console.error('Missing STRIPE_SECRET_KEY in .env.local')
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })

const PRODUCT_NAME = 'Pro — Alizé'
const MONTHLY_EUR = 999 // €9.99
const YEARLY_EUR = 9990 // €99.90 (2 months free vs monthly)

async function findOrCreateProduct() {
  const existing = await stripe.products.list({ active: true, limit: 20 })
  const match = existing.data.find((p) => p.name === PRODUCT_NAME)
  if (match) return match
  return stripe.products.create({
    name: PRODUCT_NAME,
    description: 'Clients et factures illimités',
  })
}

async function findOrCreatePrice(productId, interval, amount) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 20 })
  const match = prices.data.find(
    (p) => p.recurring?.interval === interval && p.currency === 'eur' && p.unit_amount === amount
  )
  if (match) return match
  return stripe.prices.create({
    product: productId,
    currency: 'eur',
    unit_amount: amount,
    recurring: { interval },
    nickname: interval === 'month' ? 'Pro mensuel' : 'Pro annuel',
  })
}

function upsertEnv(key, value) {
  const idx = envLines.findIndex((l) => l.startsWith(`${key}=`))
  const line = `${key}=${value}`
  if (idx >= 0) envLines[idx] = line
  else envLines.push(line)
}

const product = await findOrCreateProduct()
const monthly = await findOrCreatePrice(product.id, 'month', MONTHLY_EUR)
const yearly = await findOrCreatePrice(product.id, 'year', YEARLY_EUR)

upsertEnv('STRIPE_PRO_MONTHLY_PRICE_ID', monthly.id)
upsertEnv('STRIPE_PRO_YEARLY_PRICE_ID', yearly.id)
writeFileSync(envPath, envLines.join('\n').replace(/\n?$/, '\n'))

console.log('Product:', product.id, product.name)
console.log('Monthly price:', monthly.id, `(€${(MONTHLY_EUR / 100).toFixed(2)}/mo)`)
console.log('Yearly price:', yearly.id, `(€${(YEARLY_EUR / 100).toFixed(2)}/yr)`)
console.log('Updated .env.local with price IDs.')
