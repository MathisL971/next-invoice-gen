/** Public Pro plan prices (EUR). Stripe amounts are in cents. */
export const PRO_PRICING = {
  monthly: {
    amountCents: 999,
    label: '9,99 €',
    per: 'mois',
  },
  yearly: {
    amountCents: 9990,
    label: '99,90 €',
    per: 'an',
    savings: '2 mois offerts',
  },
} as const

export type BillingInterval = keyof typeof PRO_PRICING
