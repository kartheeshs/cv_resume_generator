import Link from 'next/link';

const features = [
  {
    title: 'Streamed PDF generation',
    description:
      'Generate resumes on the fly without storing files thanks to Next.js route handlers and @react-pdf/renderer.',
  },
  {
    title: 'Secure authentication',
    description:
      'Offer passwordless email links and Google sign-in powered by Firebase Auth in the Tokyo region.',
  },
  {
    title: 'Flexible editing',
    description:
      'Save drafts, templates, and entitlement tracking in Firestore so your data is always up to date.',
  },
  {
    title: 'Ready to scale',
    description:
      'Deploy on Vercel with server-side rendering, connect Upstash for rate limiting, and plug Stripe in when you are ready to charge.',
  },
];

export default function LandingPage() {
  return (
    <main
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '3rem 1.5rem 4rem',
      }}
    >
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center',
          marginBottom: '4rem',
        }}
      >
        <div>
          <span
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600,
              color: '#6366f1',
            }}
          >
            Built for career storytellers
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            Turn your experience into a standout resume in minutes.
          </h1>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            Our CV Resume Generator combines the best developer stack recommendations you provided
            with a beautiful authoring experience. Start for free and grow to a full-featured
            platform with payments when you are ready.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              style={{
                background: '#1d4ed8',
                color: '#fff',
                padding: '0.9rem 1.6rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
              }}
            >
              Get started
            </Link>
            <Link
              href="/dashboard"
              style={{
                border: '1px solid #1d4ed8',
                color: '#1d4ed8',
                padding: '0.9rem 1.6rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
              }}
            >
              Enter the app
            </Link>
          </div>
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(30, 64, 175, 0.2)',
            padding: '2rem',
            border: '1px solid #e2e8f0',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            Launch checklist
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
            {features.map((feature) => (
              <li
                key={feature.title}
                style={{
                  border: '1px solid #cbd5f5',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  background: '#eef2ff',
                }}
              >
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem' }}>{feature.title}</h3>
                <p style={{ margin: 0, lineHeight: 1.55 }}>{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
