'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const marketingLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#templates', label: 'Templates' },
  { href: '/#pricing', label: 'Pricing' },
];

export function TopNav() {
  const { user, profile, signOut } = useAuth();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.75rem',
        borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
        background: 'rgba(255, 255, 255, 0.86)',
        position: 'sticky',
        top: 0,
        backdropFilter: 'blur(14px)',
        zIndex: 10,
        boxShadow: '0 24px 60px -40px rgba(15, 23, 42, 0.3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2.25rem',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
            color: '#0f172a',
            textDecoration: 'none',
          }}
        >
          <span
            aria-hidden
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '1.1rem',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(59, 130, 246, 0.35))',
              color: '#0b3a7f',
              fontWeight: 800,
              letterSpacing: '0.05em',
              fontSize: '0.95rem',
            }}
          >
            GM7
          </span>
          <span style={{ display: 'grid', lineHeight: 1.1 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Career Studio</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af' }}>GM7</span>
          </span>
        </Link>
        <nav
          aria-label="Primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            flexWrap: 'wrap',
            fontWeight: 600,
          }}
        >
          {marketingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              style={{
                color: '#1f2937',
                padding: '0.45rem 0.75rem',
                borderRadius: '9999px',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            style={{
              color: '#1d4ed8',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(37, 99, 235, 0.12)',
            }}
          >
            Dashboard
          </Link>
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              style={{
                color: '#0f172a',
                padding: '0.45rem 0.85rem',
                borderRadius: '9999px',
                background: 'rgba(14, 165, 233, 0.12)',
              }}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {user ? (
          <button
            type="button"
            onClick={() => signOut()}
            style={{
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #4338ca)',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '9999px',
              fontWeight: 600,
              boxShadow: '0 16px 40px -28px rgba(37, 99, 235, 0.8)',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        ) : (
          <Link
            href="/login"
            style={{
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #4338ca)',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '9999px',
              fontWeight: 600,
              boxShadow: '0 16px 40px -28px rgba(37, 99, 235, 0.8)',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
