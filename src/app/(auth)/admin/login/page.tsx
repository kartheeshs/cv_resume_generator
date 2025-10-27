'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CareerStudioLogo } from '@/components/CareerStudioLogo';
import { useLocalization } from '@/context/LocalizationContext';
import styles from '../../login/login.module.css';

export default function AdminLoginPage() {
  const { profile, signInWithPassword, signOut, user } = useAuth();
  const router = useRouter();
  const { copy } = useLocalization();
  const adminCopy = copy.adminLogin;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.role === 'admin') {
      router.replace('/admin');
    }
  }, [profile, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setStatus(adminCopy.status.missingCredentials);
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await signInWithPassword(email, password);
      if (!result || result.role !== 'admin') {
        setStatus(adminCopy.status.invalidRole);
        await signOut();
        return;
      }
      router.replace('/admin');
    } catch (error) {
      console.error('Admin sign-in failed', error);
      setStatus(adminCopy.status.signInError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroIdentity}>
          <span className={styles.heroBadge}>
            <CareerStudioLogo variant="inline" markSize={34} wordmarkStyle={{ fontSize: '0.95rem' }} />
          </span>
          <span className={styles.heroTagline}>{adminCopy.heroTagline}</span>
        </div>
        <h1 className={styles.heroTitle}>{adminCopy.heroTitle}</h1>
        <p className={styles.heroCopy}>{adminCopy.heroCopy}</p>
        <div className={styles.brandRow}>
          <span>{adminCopy.heroLinkPrompt}</span>
          <Link href="/login" style={{ color: '#e0e7ff', fontWeight: 600 }}>
            {adminCopy.heroLinkText}
          </Link>
        </div>
      </div>

      <div className={styles.cardWrapper}>
        <main className={`${styles.card} ${styles.cardCompact}`}>
          <header className={styles.cardHeader}>
            <h1>{adminCopy.cardTitle}</h1>
            <p>{adminCopy.cardCopy}</p>
          </header>

          <form onSubmit={handleSubmit} className={`${styles.form} ${styles.formCompact}`}>
            <div className={styles.inputGroup}>
              <label htmlFor="admin-email">{adminCopy.labels.email}</label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={adminCopy.placeholders.email}
                className={styles.input}
                autoComplete="email"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="admin-password">{adminCopy.labels.password}</label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={adminCopy.placeholders.password}
                className={styles.input}
                minLength={8}
                autoComplete={user ? 'current-password' : 'new-password'}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.primaryButton}>
              {loading ? adminCopy.submitLoading : adminCopy.submitIdle}
            </button>
          </form>

          {status && <p className={styles.status}>{status}</p>}
        </main>
      </div>
    </div>
  );
}
