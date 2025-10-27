'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

type AuthMode = 'signin' | 'signup';
type AuthMethod = 'magic-link' | 'password';

export default function LoginPage() {
  const { sendEmailLink, signInWithGoogle, signInWithPassword, signUpWithPassword, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [method, setMethod] = useState<AuthMethod>('magic-link');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (method === 'password') {
      await handlePasswordSubmit(event);
      return;
    }
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

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (method !== 'password') return;
    if (!email || !password) {
      setStatus('Please provide both an email address and password.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setStatus('Choose a password with at least 8 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password);
      } else {
        await signUpWithPassword(email, password);
      }
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      setStatus(
        mode === 'signin'
          ? 'Unable to sign in with that password. Please check your details and try again.'
          : 'Unable to create the account. Please verify your details and try again.'
      );
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
                ? 'Choose a secure password login or receive a one-time magic link. You can also continue instantly with Google.'
                : 'Create your account with a password or request a secure email link. Google sign-in is also available.'}
            </p>
          </header>

          <div className={styles.methodSwitch}>
            <button
              type="button"
              className={method === 'magic-link' ? styles.methodActive : styles.methodButton}
              onClick={() => {
                setMethod('magic-link');
                setStatus(null);
                setPassword('');
                setConfirmPassword('');
              }}
            >
              Email magic link
            </button>
            <button
              type="button"
              className={method === 'password' ? styles.methodActive : styles.methodButton}
              onClick={() => {
                setMethod('password');
                setStatus(null);
                setPassword('');
                setConfirmPassword('');
              }}
            >
              Use password
            </button>
          </div>

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
            {method === 'password' && (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter a secure password"
                    className={styles.input}
                    minLength={8}
                  />
                </div>
                {mode === 'signup' && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter your password"
                      className={styles.input}
                      minLength={8}
                    />
                  </div>
                )}
              </>
            )}
            <button type="submit" disabled={sending} className={styles.primaryButton}>
              {sending
                ? method === 'password'
                  ? mode === 'signin'
                    ? 'Signing in…'
                    : 'Creating account…'
                  : 'Sending…'
                : method === 'password'
                ? mode === 'signin'
                  ? 'Sign in with password'
                  : 'Create account with password'
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
              setPassword('');
              setConfirmPassword('');
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
