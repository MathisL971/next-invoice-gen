export const PRICES = {
  monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
} as const

export type Interval = keyof typeof PRICES

export function priceIdFor(interval: Interval): string {
  const id = PRICES[interval]
  if (!id) {
    throw new Error(`Missing Stripe price ID env var for interval: ${interval}`)
  }
  return id
}
