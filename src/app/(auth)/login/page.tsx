'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

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
    <main
      style={{
        maxWidth: '480px',
        margin: '4rem auto',
        background: '#fff',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 20px 45px -20px rgba(30, 64, 175, 0.25)',
        border: '1px solid #e2e8f0',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {mode === 'signin' ? 'Sign in' : 'Create your account'}
      </h1>
      <p style={{ marginBottom: '2rem', color: '#475569' }}>
        {mode === 'signin'
          ? 'Use a passwordless email link or your Google account to access the CV Resume Generator.'
          : 'We will send you a secure email link to finish creating your account. You can also continue with Google.'}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={{ fontWeight: 600 }}>Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid #cbd5f5',
              fontSize: '1rem',
            }}
          />
        </label>
        <button
          type="submit"
          disabled={sending}
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: sending ? '#a5b4fc' : '#4338ca',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          {sending
            ? 'Sending...'
            : mode === 'signin'
            ? 'Email me a sign-in link'
            : 'Email me a sign-up link'}
        </button>
      </form>
      <div
        style={{
          margin: '2rem 0',
          textAlign: 'center',
          color: '#94a3b8',
        }}
      >
        — or —
      </div>
      <button
        onClick={handleGoogle}
        style={{
          width: '100%',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid #1d4ed8',
          background: '#fff',
          color: '#1d4ed8',
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => {
          const nextMode: AuthMode = mode === 'signin' ? 'signup' : 'signin';
          setMode(nextMode);
          setStatus(null);
        }}
        style={{
          marginTop: '1.5rem',
          width: '100%',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.75rem',
          border: 'none',
          background: 'transparent',
          color: '#4338ca',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        {mode === 'signin'
          ? "Need an account? Create one"
          : 'Already have an account? Sign in'}
      </button>
      {status && (
        <p style={{ marginTop: '1.5rem', color: '#1d4ed8' }}>{status}</p>
      )}
    </main>
  );
}
