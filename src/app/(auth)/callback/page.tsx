'use client';

import { useEffect, useState } from 'react';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeEmailLinkSignIn } = useAuth();
  const [status, setStatus] = useState('Completing sign-in...');

  useEffect(() => {
    async function finishSignIn() {
      try {
        const emailFromQuery = searchParams?.get('email');
        let email = emailFromQuery ?? '';
        if (!email) {
          email = window.localStorage.getItem('emailForSignIn') ?? '';
        }
        if (!email) {
          setStatus('Missing email address. Please start the sign-in flow again.');
          return;
        }
        if (isSignInWithEmailLink(auth, window.location.href)) {
          await completeEmailLinkSignIn(email);
          window.localStorage.removeItem('emailForSignIn');
          const flowMode = window.localStorage.getItem('authFlowMode');
          window.localStorage.removeItem('authFlowMode');
          if (flowMode === 'signup') {
            setStatus('Account confirmed! Redirecting to your dashboard...');
          } else {
            setStatus('Sign-in complete! Redirecting to your dashboard...');
          }
          router.replace('/dashboard');
        } else {
          setStatus('This link is no longer valid. Please request a new sign-in email.');
        }
      } catch (error) {
        console.error(error);
        setStatus('We could not complete your sign-in. Please retry.');
      }
    }

    finishSignIn();
  }, [completeEmailLinkSignIn, router, searchParams]);

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        fontSize: '1.1rem',
        color: '#1d4ed8',
      }}
    >
      {status}
    </main>
  );
}
