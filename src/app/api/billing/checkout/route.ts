import { NextRequest, NextResponse } from 'next/server';

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

let cachedPriceId: string | null | undefined;

async function resolveStripePriceId(secretKey: string): Promise<string | null> {
  if (cachedPriceId) {
    return cachedPriceId;
  }

  const configuredPriceId = process.env.STRIPE_PRICE_ID;
  if (configuredPriceId) {
    cachedPriceId = configuredPriceId;
    return configuredPriceId;
  }

  const lookupKey = DEFAULT_STRIPE_PRICE_LOOKUP_KEY;

  try {
    const search = new URLSearchParams({ limit: '1' });
    search.append('lookup_keys[]', lookupKey);
    const response = await fetch(`https://api.stripe.com/v1/prices?${search.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: Array<{ id?: string | null }>;
          error?: { message?: string };
        }
      | null;

    if (response.ok && payload?.data?.length && payload.data[0]?.id) {
      cachedPriceId = payload.data[0].id ?? null;
      if (cachedPriceId) {
        return cachedPriceId;
      }
    } else if (!response.ok) {
      console.error('Stripe price lookup failed', payload);
    }
  } catch (error) {
    console.error('Stripe price lookup request failed', error);
  }

  try {
    const resolvedUnitAmount = Number.isFinite(DEFAULT_STRIPE_PRICE_AMOUNT)
      ? Math.max(0, Math.round(DEFAULT_STRIPE_PRICE_AMOUNT))
      : 1000;
    const params = new URLSearchParams();
    params.append('unit_amount', String(resolvedUnitAmount));
    params.append('currency', DEFAULT_STRIPE_PRICE_CURRENCY);
    params.append('recurring[interval]', DEFAULT_STRIPE_PRICE_INTERVAL);
    params.append('lookup_key', lookupKey);
    params.append('product_data[name]', DEFAULT_STRIPE_PRODUCT_NAME);
    params.append('tax_behavior', 'exclusive');

    const response = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null;

    if (!response.ok || !payload?.id) {
      console.error('Stripe price creation failed', payload);
      return null;
    }

    cachedPriceId = payload.id;
    return cachedPriceId;
  } catch (error) {
    console.error('Stripe price creation request failed', error);
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

  const priceId = await resolveStripePriceId(secretKey);

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

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('success_url', `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${origin}/dashboard`);
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', '1');
  params.append('allow_promotion_codes', 'true');

  if (body.customerId) {
    params.append('customer', body.customerId);
  } else if (body.email) {
    params.append('customer_email', body.email);
  }

  if (body.userId) {
    params.append('metadata[user_id]', body.userId);
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const payload = (await response.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;

    if (!response.ok || !payload?.url) {
      const message = payload?.error?.message ?? 'Unable to create checkout session.';
      console.error('Stripe checkout creation failed', payload);
      return NextResponse.json({ message }, { status: 500 });
    }

    return NextResponse.json({ url: payload.url });
  } catch (error) {
    console.error('Stripe checkout request failed', error);
    return NextResponse.json({ message: 'Unable to connect to Stripe.' }, { status: 502 });
  }
}
