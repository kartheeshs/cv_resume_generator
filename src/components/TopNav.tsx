'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/context/LocalizationContext';
import { usePathname } from 'next/navigation';
import { CareerStudioLogo } from './CareerStudioLogo';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const onAdminRoute = pathname?.startsWith('/admin');
  const { user, signOut } = useAuth();
  const { copy, language, setLanguage } = useLocalization();
  const { nav } = copy;

  if (onAdminRoute) {
    return null;
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          padding: '0.85rem clamp(1.25rem, 4vw, 2rem)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#0f172a',
              textDecoration: 'none',
            }}
          >
            <CareerStudioLogo />
          </Link>
          <nav
            aria-label="Primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              flexWrap: 'wrap',
              fontWeight: 600,
            }}
          >
            {nav.marketingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                style={{
                  color: '#1f2937',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              style={{
                color: '#2563eb',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.75rem',
                background: 'rgba(37, 99, 235, 0.12)',
                textDecoration: 'none',
              }}
            >
              {nav.dashboard}
            </Link>
          </nav>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              borderRadius: '0.75rem',
              padding: '0.35rem 0.75rem',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#475569',
            }}
          >
            <svg
              aria-hidden
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flex: '0 0 auto' }}
            >
              <path
                d="M9.5 3.5a6 6 0 104.243 10.243l2.628 2.629a1 1 0 001.415-1.415l-2.629-2.628A6 6 0 009.5 3.5z"
                stroke="#475569"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="search"
              placeholder={nav.searchPlaceholder}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                padding: '0.15rem 0 0.15rem 0.45rem',
                fontSize: '0.9rem',
                color: '#0f172a',
                minWidth: '160px',
              }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#fff',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '0.75rem',
              padding: '0.35rem 0.65rem',
              color: '#475569',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{nav.languageLabel}</span>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value === 'ja' ? 'ja' : 'en')
              }
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#1f2937',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {user ? (
            <button
              type="button"
              onClick={() => signOut()}
              style={{
                border: '1px solid rgba(37, 99, 235, 0.35)',
                background: '#2563eb',
                color: '#fff',
                padding: '0.55rem 1.1rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                boxShadow: '0 12px 28px -18px rgba(37, 99, 235, 0.6)',
                cursor: 'pointer',
              }}
            >
              {nav.signOut}
            </button>
          ) : (
            <Link
              href="/login"
              style={{
                border: '1px solid rgba(37, 99, 235, 0.35)',
                background: '#2563eb',
                color: '#fff',
                padding: '0.55rem 1.1rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 12px 28px -18px rgba(37, 99, 235, 0.6)',
              }}
            >
              {nav.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
