import Stripe from 'stripe';

let cachedClient: { key: string; instance: Stripe } | null = null;

export function getStripeClient(secretKey: string): Stripe {
  if (!cachedClient || cachedClient.key !== secretKey) {
    cachedClient = {
      key: secretKey,
      instance: new Stripe(secretKey, {
        apiVersion: '2024-06-20',
      }),
    };
  }

  return cachedClient.instance;
}

