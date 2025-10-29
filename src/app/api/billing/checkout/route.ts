import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface CheckoutRequestBody {
  userId?: string;
  email?: string;
  customerId?: string;
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey || !priceId) {
    return NextResponse.json(
      { message: 'Stripe billing is not configured.' },
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
