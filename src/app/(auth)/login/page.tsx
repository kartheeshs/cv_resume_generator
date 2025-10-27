'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const { sendEmailLink, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    try {
      await sendEmailLink(email);
      const confirmationText =
        mode === 'signup'
          ? 'Check your inbox to confirm your new account.'
          : 'Check your inbox for a secure sign-in link.';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('authFlowMode', mode);
      }
      setStatus(confirmationText);
    } catch (error) {
      console.error(error);
      setStatus('Unable to send sign-in email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('authFlowMode');
      }
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      setStatus('Google sign-in failed. Please retry.');
    }
  };

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [router, user]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.heroBadge}>
          <span className={styles.brandMark}>CV</span>
          Career Studio
        </span>
        <h1 className={styles.heroTitle}>A polished resume platform that feels like your design team built it.</h1>
        <p className={styles.heroCopy}>
          Craft localized resumes and global CVs with modern templates, collaborative controls, and export-ready PDF
          rendering—all secured by passwordless authentication.
        </p>
        <div className={styles.brandRow}>
          <span>Trusted for premium resume workflows.</span>
        </div>
      </div>

      <div className={styles.cardWrapper}>
        <main className={styles.card}>
          <header className={styles.cardHeader}>
            <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
            <p>
              {mode === 'signin'
                ? 'Sign in with a passwordless email link or continue instantly with Google.'
                : 'We will send you a secure email link to finish creating your account. You can also continue with Google.'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={styles.input}
              />
            </div>
            <button type="submit" disabled={sending} className={styles.primaryButton}>
              {sending
                ? 'Sending…'
                : mode === 'signin'
                ? 'Email me a sign-in link'
                : 'Email me a sign-up link'}
            </button>
          </form>

          <div className={styles.divider}>or continue with</div>

          <button onClick={handleGoogle} className={styles.secondaryButton}>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => {
              const nextMode: AuthMode = mode === 'signin' ? 'signup' : 'signin';
              setMode(nextMode);
              setStatus(null);
            }}
            className={styles.ghostButton}
          >
            {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>

          {status && <p className={styles.status}>{status}</p>}
        </main>
      </div>
    </div>
  );
}
