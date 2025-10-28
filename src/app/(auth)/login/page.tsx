'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CareerStudioLogo } from '@/components/CareerStudioLogo';
import { useLocalization } from '@/context/LocalizationContext';
import styles from './login.module.css';

type AuthMode = 'signin' | 'signup';
type AuthMethod = 'magic-link' | 'password';

export default function LoginPage() {
  const { sendEmailLink, signInWithGoogle, signInWithPassword, signUpWithPassword, user } = useAuth();
  const router = useRouter();
  const { copy } = useLocalization();
  const loginCopy = copy.login;
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
          ? loginCopy.status.emailSentSignUp
          : loginCopy.status.emailSentSignIn;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('authFlowMode', mode);
      }
      setStatus(confirmationText);
    } catch (error) {
      console.error(error);
      setStatus(loginCopy.status.sendEmailError);
    } finally {
      setSending(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (method !== 'password') return;
    if (!email || !password) {
      setStatus(loginCopy.status.missingCredentials);
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setStatus(loginCopy.status.shortPassword);
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setStatus(loginCopy.status.passwordMismatch);
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
          ? loginCopy.status.passwordSignInFailed
          : loginCopy.status.passwordSignUpFailed
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
      setStatus(loginCopy.status.googleFailed);
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
        <div className={styles.heroIdentity}>
          <span className={styles.heroBadge}>
            <CareerStudioLogo variant="inline" markSize={34} wordmarkStyle={{ fontSize: '0.95rem' }} />
          </span>
          <span className={styles.heroTagline}>{loginCopy.heroTagline}</span>
        </div>
        <h1 className={styles.heroTitle}>{loginCopy.heroTitle}</h1>
        <p className={styles.heroCopy}>{loginCopy.heroCopy}</p>
        <div className={styles.brandRow}>
          <span>{loginCopy.heroBrand}</span>
        </div>
      </div>

      <div className={styles.cardWrapper}>
        <main className={styles.card}>
          <header className={styles.cardHeader}>
            <h1>{mode === 'signin' ? loginCopy.cardTitleSignIn : loginCopy.cardTitleSignUp}</h1>
            <p>{mode === 'signin' ? loginCopy.cardDescriptionSignIn : loginCopy.cardDescriptionSignUp}</p>
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
              {loginCopy.methodMagicLink}
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
              {loginCopy.methodPassword}
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">{loginCopy.labels.email}</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={loginCopy.placeholders.email}
                className={styles.input}
              />
            </div>
            {method === 'password' && (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="password">{loginCopy.labels.password}</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={loginCopy.placeholders.password}
                    className={styles.input}
                    minLength={8}
                  />
                </div>
                {mode === 'signup' && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword">{loginCopy.labels.confirmPassword}</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder={loginCopy.placeholders.confirmPassword}
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
                    ? loginCopy.submit.signingIn
                    : loginCopy.submit.creatingAccount
                  : loginCopy.submit.sending
                : method === 'password'
                ? mode === 'signin'
                  ? loginCopy.submit.passwordSignIn
                  : loginCopy.submit.passwordSignUp
                : mode === 'signin'
                ? loginCopy.submit.magicLinkSignIn
                : loginCopy.submit.magicLinkSignUp}
            </button>
          </form>

          <div className={styles.divider}>{loginCopy.divider}</div>

          <button onClick={handleGoogle} className={styles.secondaryButton}>
            {loginCopy.continueWithGoogle}
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
            {mode === 'signin' ? loginCopy.switchToSignUp : loginCopy.switchToSignIn}
          </button>

          {status && <p className={styles.status}>{status}</p>}
        </main>
      </div>
    </div>
  );
}
