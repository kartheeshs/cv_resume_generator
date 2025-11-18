const DEFAULT_STRIPE_PUBLISHABLE_KEY =
  process.env.NODE_ENV === 'production'
    ? undefined
    : 'pk_test_51SMrPSRuLo7evHJI5TuYsmpqHAtIOGahp0NCsder674sXQ7wDrgNomfKKmZWyB6fFgREw88cprnFjJmcfIXu628L00o5NvgAzJ';

const env = {};

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && DEFAULT_STRIPE_PUBLISHABLE_KEY) {
  env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = DEFAULT_STRIPE_PUBLISHABLE_KEY;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env,
};

export default nextConfig;
