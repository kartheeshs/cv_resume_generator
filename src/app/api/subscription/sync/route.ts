import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getStripeClient } from '@/lib/stripe/server';

export const runtime = 'nodejs';

function resolveEntitlements(status: string | undefined) {
  if (!status) {
    return { plan: 'free' as const, remainingDownloads: 5 };
  }
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'trialing' || normalized === 'past_due') {
    return { plan: 'pro' as const, remainingDownloads: 1000 };
  }
  return { plan: 'free' as const, remainingDownloads: 5 };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId }: { userId?: string } = body;

    if (!userId) {
      return NextResponse.json({ message: 'Missing user identifier.' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(userId);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const customerId = snapshot.get('stripeCustomerId') as string | undefined;

    if (!customerId) {
      await userRef.set(
        {
          entitlements: { plan: 'free', remainingDownloads: 5 },
          subscription: {
            status: 'none',
            currentPeriodEnd: null,
            lastSyncedAt: Timestamp.now(),
          },
        },
        { merge: true }
      );
      return NextResponse.json({ plan: 'free', status: 'none' });
    }

    const stripe = getStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 5,
      expand: ['data.default_payment_method'],
    });

    const activeSubscription = subscriptions.data.find((subscription) =>
      ['active', 'trialing', 'past_due'].includes(subscription.status)
    );

    const status = activeSubscription?.status ?? 'canceled';
    const entitlements = resolveEntitlements(status);

    await userRef.set(
      {
        entitlements,
        subscription: {
          id: activeSubscription?.id ?? null,
          status,
          currentPeriodEnd: activeSubscription?.current_period_end
            ? Timestamp.fromMillis(activeSubscription.current_period_end * 1000)
            : null,
          lastSyncedAt: Timestamp.now(),
        },
      },
      { merge: true }
    );

    return NextResponse.json({ plan: entitlements.plan, status });
  } catch (error) {
    console.error('Failed to sync subscription status', error);
    return NextResponse.json({ message: 'Unable to sync subscription.' }, { status: 500 });
  }
}
