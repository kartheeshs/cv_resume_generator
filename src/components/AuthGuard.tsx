'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ children, requireAdmin = false, redirectTo = '/login' }: AuthGuardProps) {
  const router = useRouter();
  const { user, loading, profile } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAuthorized(false);
      router.replace(redirectTo);
      return;
    }
    if (requireAdmin && profile?.role !== 'admin') {
      setIsAuthorized(false);
      router.replace('/dashboard');
      return;
    }
    setIsAuthorized(true);
  }, [loading, user, requireAdmin, profile, router, redirectTo]);

  if (loading || !isAuthorized) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          fontSize: '1.125rem',
        }}
      >
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}
