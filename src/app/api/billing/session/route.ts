import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ message: 'Stripe billing is not configured.' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ message: 'Missing session identifier.' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const payload = (await response.json().catch(() => null)) as
      | {
          id?: string;
          status?: string;
          customer?: string | { id?: string };
          subscription?: {
            id?: string;
            status?: string;
            current_period_end?: number;
            customer?: string;
          };
        }
      | { error?: { message?: string } }
      | null;

    if (!response.ok || !payload || 'error' in (payload as { error?: { message?: string } })) {
      const message = (payload as { error?: { message?: string } })?.error?.message ?? 'Unable to load session.';
      console.error('Stripe session lookup failed', payload);
      return NextResponse.json({ message }, { status: 502 });
    }

    const subscription = payload.subscription ?? null;
    const customerId =
      typeof payload.customer === 'string'
        ? payload.customer
        : payload.customer?.id ?? subscription?.customer ?? null;

    const currentPeriodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    return NextResponse.json({
      status: payload.status,
      subscriptionId: subscription?.id ?? null,
      subscriptionStatus: subscription?.status ?? null,
      customerId,
      currentPeriodEnd,
    });
  } catch (error) {
    console.error('Stripe session fetch failed', error);
    return NextResponse.json({ message: 'Unable to contact Stripe.' }, { status: 502 });
  }
}
