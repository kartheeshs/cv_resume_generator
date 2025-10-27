import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getStripeClient } from '@/lib/stripe/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      priceId,
      successUrl,
      cancelUrl,
    }: { userId?: string; priceId?: string; successUrl?: string; cancelUrl?: string } = body;

    if (!userId || !priceId) {
      return NextResponse.json({ message: 'Missing user or price identifier.' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(userId);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const stripe = getStripeClient();
    const userData = snapshot.data() ?? {};
    const email = (userData.email as string) ?? undefined;
    let customerId = (userData.stripeCustomerId as string | undefined) ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUID: userId },
      });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    const baseUrl =
      request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const resolvedSuccessUrl = successUrl ?? `${baseUrl}/dashboard?upgrade=success`;
    const resolvedCancelUrl = cancelUrl ?? `${baseUrl}/dashboard?upgrade=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: resolvedSuccessUrl,
      cancel_url: resolvedCancelUrl,
      metadata: { firebaseUID: userId },
    });

    await userRef.set(
      {
        subscription: {
          lastCheckoutSessionId: session.id,
          lastCheckoutCreatedAt: Timestamp.now(),
        },
      },
      { merge: true }
    );

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Failed to create Stripe checkout session', error);
    return NextResponse.json({ message: 'Unable to create checkout session.' }, { status: 500 });
  }
}
