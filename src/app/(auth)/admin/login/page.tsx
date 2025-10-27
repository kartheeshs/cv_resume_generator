'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CareerStudioLogo } from '@/components/CareerStudioLogo';
import styles from '../../login/login.module.css';

export default function AdminLoginPage() {
  const { profile, signInWithPassword, signOut, user } = useAuth();
  const router = useRouter();
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
      setStatus('Enter the admin email address and password.');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await signInWithPassword(email, password);
      if (!result || result.role !== 'admin') {
        setStatus('This account does not have admin access.');
        await signOut();
        return;
      }
      router.replace('/admin');
    } catch (error) {
      console.error('Admin sign-in failed', error);
      setStatus('Unable to sign in. Confirm your admin credentials and try again.');
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
          <span className={styles.heroTagline}>Admin workspace</span>
        </div>
        <h1 className={styles.heroTitle}>Secure admin access</h1>
        <p className={styles.heroCopy}>
          Monitor workspace activity, reset download allowances, and oversee subscriptions. Only approved administrators can
          access this console.
        </p>
        <div className={styles.brandRow}>
          <span>Need the main workspace?</span>
          <Link href="/login" style={{ color: '#e0e7ff', fontWeight: 600 }}>
            Return to member sign-in
          </Link>
        </div>
      </div>

      <div className={styles.cardWrapper}>
        <main className={styles.card}>
          <header className={styles.cardHeader}>
            <h1>Admin console sign-in</h1>
            <p>Use the credentials issued to administrators of Career Studio GM7.</p>
          </header>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="admin-email">Admin email</label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className={styles.input}
                autoComplete="email"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your admin password"
                className={styles.input}
                minLength={8}
                autoComplete={user ? 'current-password' : 'new-password'}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.primaryButton}>
              {loading ? 'Signing in…' : 'Access admin dashboard'}
            </button>
          </form>

          {status && <p className={styles.status}>{status}</p>}
        </main>
      </div>
    </div>
  );
}
