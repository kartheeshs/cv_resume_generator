'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

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
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          fontWeight: 700,
          fontSize: '1.15rem',
          color: '#0f172a',
        }}
      >
        <span
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '1rem',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(67, 56, 202, 0.32))',
            color: '#1e3a8a',
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
        >
          CV
        </span>
        <span>Career Studio</span>
      </Link>
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <>
            <Link
              href="/dashboard"
              style={{
                fontWeight: 600,
                color: '#1e3a8a',
                padding: '0.45rem 0.9rem',
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
                  fontWeight: 600,
                  color: '#1e3a8a',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '9999px',
                  background: 'rgba(14, 165, 233, 0.12)',
                }}
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => signOut()}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #4338ca)',
                color: '#fff',
                padding: '0.6rem 1.2rem',
                borderRadius: '9999px',
                fontWeight: 600,
                boxShadow: '0 16px 40px -28px rgba(37, 99, 235, 0.8)',
              }}
            >
              Sign out
            </button>
          </>
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
            }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
