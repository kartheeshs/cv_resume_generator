import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getStripeClient } from '@/lib/stripe/server';

export const runtime = 'nodejs';

const DEFAULT_STRIPE_SECRET_KEY =
  process.env.NODE_ENV === 'production'
    ? undefined
    : 'sk_test_51SMrPSRuLo7evHJI0rlQCC52vXJhmCnd2CQbEfCU6PhtPLdMBRgkvi4uaa5BFx8V3OXI75KBbxwRBXOkmVXTSiSd00tmb4ztX2';

export async function GET(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? DEFAULT_STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ message: 'Stripe billing is not configured.' }, { status: 503 });
  }

  const stripe = getStripeClient(secretKey);

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ message: 'Missing session identifier.' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const subscriptionObject =
      typeof session.subscription === 'string' ? null : (session.subscription as Stripe.Subscription | null);

    const rawCustomer =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null;

    const subscriptionCustomer =
      typeof subscriptionObject?.customer === 'string'
        ? subscriptionObject.customer
        : subscriptionObject?.customer?.id ?? null;

    const customerId = rawCustomer ?? subscriptionCustomer ?? null;

    const currentPeriodEnd = subscriptionObject?.current_period_end
      ? new Date(subscriptionObject.current_period_end * 1000).toISOString()
      : null;

    return NextResponse.json({
      status: session.status,
      subscriptionId: subscriptionObject?.id ?? null,
      subscriptionStatus: subscriptionObject?.status ?? null,
      customerId,
      currentPeriodEnd,
    });
  } catch (error) {
    console.error('Stripe session fetch failed', error);
    return NextResponse.json({ message: 'Unable to contact Stripe.' }, { status: 502 });
  }
}
