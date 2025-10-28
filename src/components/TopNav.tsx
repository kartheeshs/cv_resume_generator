'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/context/LocalizationContext';
import { usePathname } from 'next/navigation';
import { CareerStudioLogo } from './CareerStudioLogo';
import styles from './TopNav.module.css';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const onAdminRoute = pathname?.startsWith('/admin');
  const inWorkspace = pathname?.startsWith('/dashboard');
  const { user, signOut } = useAuth();
  const { copy, language, setLanguage } = useLocalization();
  const { nav } = copy;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (onAdminRoute) {
    return null;
  }

  const toggleLabel = language === 'ja' ? 'メニューを開閉' : 'Toggle menu';

  return (
    <header className={styles.root}>
      <div className={styles.container}>
        <div className={styles.brandRow}>
          <Link href="/" className={styles.brandLink}>
            <CareerStudioLogo variant="inline" markSize={36} />
          </Link>
          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-expanded={menuOpen}
            aria-label={toggleLabel}
          >
            <span className={styles.srOnly}>{toggleLabel}</span>
            <svg
              aria-hidden
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {menuOpen ? (
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#0f172a"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="#0f172a"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </button>
          {!inWorkspace && (
            <nav aria-label="Primary" className={styles.navDesktop}>
              {nav.marketingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={styles.navLink}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/dashboard" className={`${styles.navLink} ${styles.dashboardLink}`}>
                {nav.dashboard}
              </Link>
            </nav>
          )}
        </div>

        <div className={styles.actions}>
          {inWorkspace && (
            <div className={styles.workspaceActions}>
              <Link href="/" className={styles.visitLink}>
                {nav.visitWebsite}
              </Link>
              <Link
                href="/#pricing"
                prefetch={false}
                className={styles.subscribeLink}
              >
                {nav.subscribe}
              </Link>
            </div>
          )}
          <label className={styles.search}>
            <svg
              aria-hidden
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.5 3.5a6 6 0 104.243 10.243l2.628 2.629a1 1 0 001.415-1.415l-2.629-2.628A6 6 0 009.5 3.5z"
                stroke="#475569"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input type="search" placeholder={nav.searchPlaceholder} />
          </label>
          <label className={styles.language}>
            <span>{nav.languageLabel}</span>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value === 'ja' ? 'ja' : 'en')
              }
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
              className={styles.primaryButton}
            >
              {nav.signOut}
            </button>
          ) : (
            <Link href="/login" className={styles.primaryButton}>
              {nav.signIn}
            </Link>
          )}
        </div>
      </div>

      <div
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}
        aria-hidden={!menuOpen}
      >
        {!inWorkspace && (
          <nav aria-label="Mobile primary" className={styles.mobileNav}>
            {nav.marketingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={styles.mobileNavLink}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/dashboard" className={styles.mobileNavLink}>
              {nav.dashboard}
            </Link>
          </nav>
        )}

        {inWorkspace && (
          <div className={styles.mobileSection}>
            <Link href="/" className={styles.mobileNavLink}>
              {nav.visitWebsite}
            </Link>
            <Link
              href="/#pricing"
              prefetch={false}
              className={styles.mobileNavLink}
            >
              {nav.subscribe}
            </Link>
          </div>
        )}

        <div className={styles.mobileSection}>
          <label className={styles.mobileSearch}>
            <svg
              aria-hidden
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.5 3.5a6 6 0 104.243 10.243l2.628 2.629a1 1 0 001.415-1.415l-2.629-2.628A6 6 0 009.5 3.5z"
                stroke="#475569"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input type="search" placeholder={nav.searchPlaceholder} />
          </label>

          <label className={styles.mobileLanguage}>
            <span>{nav.languageLabel}</span>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value === 'ja' ? 'ja' : 'en')
              }
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
              className={`${styles.primaryButton} ${styles.mobilePrimary}`}
            >
              {nav.signOut}
            </button>
          ) : (
            <Link
              href="/login"
              className={`${styles.primaryButton} ${styles.mobilePrimary}`}
            >
              {nav.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
