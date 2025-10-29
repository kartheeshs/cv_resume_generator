import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getStripeClient } from '@/lib/stripe/server';

export const runtime = 'nodejs';

interface CheckoutRequestBody {
  userId?: string;
  email?: string;
  customerId?: string;
}

const DEFAULT_STRIPE_SECRET_KEY =
  process.env.NODE_ENV === 'production'
    ? undefined
    : 'sk_test_51SMrPSRuLo7evHJI0rlQCC52vXJhmCnd2CQbEfCU6PhtPLdMBRgkvi4uaa5BFx8V3OXI75KBbxwRBXOkmVXTSiSd00tmb4ztX2';

const DEFAULT_STRIPE_PRICE_LOOKUP_KEY = process.env.STRIPE_PRICE_LOOKUP_KEY ?? 'cv_resume_generator_growth_weekly';
const DEFAULT_STRIPE_PRICE_AMOUNT = Number(process.env.STRIPE_PRICE_AMOUNT ?? '1000');
const DEFAULT_STRIPE_PRICE_CURRENCY = process.env.STRIPE_PRICE_CURRENCY ?? 'usd';
const DEFAULT_STRIPE_PRICE_INTERVAL = process.env.STRIPE_PRICE_INTERVAL ?? 'week';
const DEFAULT_STRIPE_PRODUCT_NAME =
  process.env.STRIPE_PRICE_PRODUCT_NAME ?? 'Career Studio GM7 Growth Subscription';

const SUPPORTED_INTERVALS: ReadonlyArray<Stripe.PriceCreateParams.Recurring.Interval> = [
  'day',
  'week',
  'month',
  'year',
];

let cachedPriceId: string | null | undefined;

async function resolveStripePriceId(stripe: Stripe): Promise<string | null> {
  if (typeof cachedPriceId === 'string') {
    return cachedPriceId;
  }

  const configuredPriceId = process.env.STRIPE_PRICE_ID;
  if (configuredPriceId) {
    cachedPriceId = configuredPriceId;
    return configuredPriceId;
  }

  const lookupKey = DEFAULT_STRIPE_PRICE_LOOKUP_KEY;

  try {
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      limit: 1,
    });

    if (prices.data.length && prices.data[0]?.id) {
      cachedPriceId = prices.data[0].id;
      return cachedPriceId;
    }
  } catch (error) {
    console.error('Stripe price lookup failed', error);
  }

  try {
    const resolvedUnitAmount = Number.isFinite(DEFAULT_STRIPE_PRICE_AMOUNT)
      ? Math.max(0, Math.round(DEFAULT_STRIPE_PRICE_AMOUNT))
      : 1000;

    const resolvedInterval = SUPPORTED_INTERVALS.includes(
      DEFAULT_STRIPE_PRICE_INTERVAL as Stripe.PriceCreateParams.Recurring.Interval
    )
      ? (DEFAULT_STRIPE_PRICE_INTERVAL as Stripe.PriceCreateParams.Recurring.Interval)
      : 'week';

    const price = await stripe.prices.create({
      unit_amount: resolvedUnitAmount,
      currency: DEFAULT_STRIPE_PRICE_CURRENCY,
      recurring: { interval: resolvedInterval },
      lookup_key: lookupKey,
      product_data: { name: DEFAULT_STRIPE_PRODUCT_NAME },
      tax_behavior: 'exclusive',
    });

    cachedPriceId = price.id;
    return cachedPriceId;
  } catch (error) {
    console.error('Stripe price creation failed', error);
    cachedPriceId = undefined;
    return null;
  }
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? DEFAULT_STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { message: 'Stripe billing is not configured.' },
      { status: 503 }
    );
  }

  const stripe = getStripeClient(secretKey);

  const priceId = await resolveStripePriceId(stripe);

  if (!priceId) {
    return NextResponse.json(
      { message: 'Stripe billing is unavailable.' },
      { status: 503 }
    );
  }

  let body: CheckoutRequestBody;
  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.email && !body.customerId) {
    return NextResponse.json(
      { message: 'An email or existing customer ID is required.' },
      { status: 400 }
    );
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard`,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
  };

  if (body.customerId) {
    sessionParams.customer = body.customerId;
  } else if (body.email) {
    sessionParams.customer_email = body.email;
  }

  if (body.userId) {
    sessionParams.metadata = { user_id: body.userId };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session?.url || !session?.id) {
      console.error('Stripe checkout creation returned invalid session', session);
      return NextResponse.json({ message: 'Unable to create checkout session.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout request failed', error);
    return NextResponse.json({ message: 'Unable to connect to Stripe.' }, { status: 502 });
  }
}
