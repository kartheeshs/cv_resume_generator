import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getStripeClient } from '@/lib/stripe/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      returnUrl,
    }: { userId?: string; returnUrl?: string } = body;

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
      return NextResponse.json({ message: 'User does not have an active Stripe customer.' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const baseUrl =
      returnUrl ?? request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: baseUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Failed to create Stripe billing portal session', error);
    return NextResponse.json({ message: 'Unable to open billing portal.' }, { status: 500 });
  }
}
