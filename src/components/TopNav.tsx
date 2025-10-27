'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const marketingLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#templates', label: 'Templates' },
  { href: '/#pricing', label: 'Pricing' },
];

const LogoMark = () => (
  <span
    aria-hidden
    style={{
      width: '46px',
      height: '46px',
      borderRadius: '1.4rem',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        'linear-gradient(140deg, rgba(14,165,233,0.95) 0%, rgba(79,70,229,0.9) 55%, rgba(168,85,247,0.9) 100%)',
      boxShadow: '0 18px 38px -26px rgba(79, 70, 229, 0.85)',
    }}
  >
    <svg
      width="28"
      height="28"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="careerStudioLogoStroke" x1="8" y1="10" x2="54" y2="54">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="55%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#f5f3ff" />
        </linearGradient>
      </defs>
      <path
        d="M44 18h-9c-8.284 0-15 6.716-15 15s6.716 15 15 15c5.201 0 9.777-2.644 12.5-6.673"
        stroke="url(#careerStudioLogoStroke)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 28l7 18 6.5-11 6.5 11L49 28"
        stroke="#f8fafc"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="20" r="4" fill="#bae6fd" />
    </svg>
  </span>
);

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
          <LogoMark />
          <span style={{ display: 'grid', lineHeight: 1.1 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.01em' }}>
              Career Studio
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1d4ed8', letterSpacing: '0.12em' }}>
              GM7
            </span>
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
          <Link
            href={profile?.role === 'admin' ? '/admin' : '/admin/login'}
            style={{
              color: profile?.role === 'admin' ? '#0f172a' : '#1f2937',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              background: profile?.role === 'admin' ? 'rgba(14, 165, 233, 0.12)' : 'transparent',
              border: profile?.role === 'admin' ? 'none' : '1px solid rgba(148, 163, 184, 0.35)',
            }}
          >
            Admin
          </Link>
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
