import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ACTIVE_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
])

function periodEndIso(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0]
  // current_period_end moved to subscription items at API version 2025-03-31.
  const ts = item?.current_period_end
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null
}

async function handleSubscriptionEvent(
  db: ReturnType<typeof supabaseAdmin>,
  sub: Stripe.Subscription,
  deleted: boolean
) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const { data: existing } = await db
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!existing) {
    // Unknown customer — likely a race with checkout.session.completed not arriving yet.
    // Insertion happens in checkout handler / checkout endpoint, so we can safely skip.
    return
  }

  const isActive = !deleted && ACTIVE_STATUSES.has(sub.status)
  const priceId = sub.items?.data?.[0]?.price?.id ?? null

  await db
    .from('subscriptions')
    .update({
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      plan: isActive ? 'pro' : 'free',
      status: deleted ? 'canceled' : sub.status,
      current_period_end: periodEndIso(sub),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    })
    .eq('user_id', existing.user_id)
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) {
    return new NextResponse('Missing signature or webhook secret', { status: 400 })
  }

  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature'
    return new NextResponse(`Webhook Error: ${msg}`, { status: 400 })
  }

  const db = supabaseAdmin()

  // Idempotency: log processed event IDs and short-circuit on replays.
  const { error: insertEventErr } = await db
    .from('processed_stripe_events')
    .insert({ event_id: event.id })
  if (insertEventErr) {
    if (insertEventErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    return NextResponse.json({ error: insertEventErr.message }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null

        if (userId && customerId) {
          await db.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            },
            { onConflict: 'user_id' }
          )
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(db, event.data.object as Stripe.Subscription, false)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(db, event.data.object as Stripe.Subscription, true)
        break

      // invoice.paid / invoice.payment_failed: state is already covered by
      // customer.subscription.updated. Subscribed only so Stripe's delivery
      // panel matches our event list. Intentional no-op.
      case 'invoice.paid':
      case 'invoice.payment_failed':
        break
    }
  } catch (err) {
    // On unexpected error, remove the idempotency row so Stripe can retry.
    await db.from('processed_stripe_events').delete().eq('event_id', event.id)
    const msg = err instanceof Error ? err.message : 'handler error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
