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
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffffdd',
        position: 'sticky',
        top: 0,
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}
    >
      <Link href="/" style={{ fontWeight: 700, fontSize: '1.15rem' }}>
        CV Resume Generator
      </Link>
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            {profile?.role === 'admin' && <Link href="/admin">Admin</Link>}
            <button
              onClick={() => signOut()}
              style={{
                border: '1px solid #1d4ed8',
                background: '#1d4ed8',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            style={{
              border: '1px solid #1d4ed8',
              background: '#1d4ed8',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
            }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
