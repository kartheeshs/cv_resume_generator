'use client';

import Link from 'next/link';
import { useLocalization } from '@/context/LocalizationContext';
import { CareerStudioLogo } from '@/components/CareerStudioLogo';

export default function PrivacyPage() {
  const { copy } = useLocalization();
  const privacy = copy.privacy;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 60%, #e2e8f0 100%)',
        padding: '3rem clamp(1.5rem, 4vw, 4rem)',
      }}
    >
      <div
        style={{
          maxWidth: '840px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '1.75rem',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          boxShadow: '0 40px 80px -50px rgba(15, 23, 42, 0.35)',
          padding: '2.5rem clamp(1.5rem, 4vw, 3rem)',
          display: 'grid',
          gap: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <CareerStudioLogo />
          </Link>
          <Link
            href="/"
            style={{
              color: '#2563eb',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid rgba(37, 99, 235, 0.4)',
              padding: '0.45rem 0.95rem',
              borderRadius: '0.75rem',
            }}
          >
            {copy.nav.marketingLinks[0]?.label ?? 'Home'}
          </Link>
        </div>

        <header style={{ display: 'grid', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: '#475569',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {privacy.updated}
          </span>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#0f172a' }}>{privacy.title}</h1>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>{privacy.intro}</p>
        </header>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {privacy.sections.map((section) => (
            <section key={section.title} style={{ display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#1f2937' }}>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0, color: '#475569', lineHeight: 1.8 }}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <section
          style={{
            background: 'rgba(79, 70, 229, 0.08)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            border: '1px solid rgba(79, 70, 229, 0.18)',
            color: '#1e1b4b',
            lineHeight: 1.7,
          }}
        >
          {privacy.disclaimer}
        </section>

        <footer style={{ display: 'grid', gap: '0.5rem', color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#1f2937' }}>{privacy.contact}</strong>
          <span>
            Career Studio GM7 · {privacy.updated}
          </span>
        </footer>
      </div>
    </div>
  );
}
