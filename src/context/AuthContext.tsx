'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  GoogleAuthProvider,
  User,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  role: UserRole;
  createdAt?: Date;
  entitlements?: {
    remainingDownloads: number;
    plan: 'free' | 'pro';
  };
  stripeCustomerId?: string;
  subscription?: {
    id: string | null;
    status: string;
    currentPeriodEnd: Date | null;
    lastSyncedAt?: Date | null;
  };
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  sendEmailLink: (email: string) => Promise<void>;
  completeEmailLinkSignIn: (email: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const resolveActionCodeBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_EMAIL_SIGN_IN_REDIRECT) {
    return process.env.NEXT_PUBLIC_EMAIL_SIGN_IN_REDIRECT;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/callback`;
  }

  return 'http://localhost:3000/callback';
};

async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    const entitlementsData = {
      plan: (data.entitlements?.plan as 'free' | 'pro') ?? 'free',
      remainingDownloads:
        typeof data.entitlements?.remainingDownloads === 'number'
          ? data.entitlements.remainingDownloads
          : 5,
    } as UserProfile['entitlements'];
    const subscriptionData = data.subscription
      ? {
          id: (data.subscription.id as string | null) ?? null,
          status: (data.subscription.status as string) ?? 'none',
          currentPeriodEnd:
            data.subscription.currentPeriodEnd?.toDate?.() ??
            (data.subscription.currentPeriodEnd instanceof Date
              ? data.subscription.currentPeriodEnd
              : null),
          lastSyncedAt:
            data.subscription.lastSyncedAt?.toDate?.() ??
            (data.subscription.lastSyncedAt instanceof Date
              ? data.subscription.lastSyncedAt
              : undefined),
        }
      : undefined;
    return {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName,
      role: (data.role as UserRole) ?? 'user',
      createdAt: data.createdAt?.toDate?.(),
      entitlements: entitlementsData,
      stripeCustomerId: data.stripeCustomerId as string | undefined,
      subscription: subscriptionData,
    };
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
    role: 'user',
    createdAt: new Date(),
    entitlements: {
      plan: 'free',
      remainingDownloads: 5,
    },
    subscription: {
      id: null,
      status: 'none',
      currentPeriodEnd: null,
    },
  };

  await setDoc(
    ref,
    {
      role: profile.role,
      email: profile.email,
      displayName: profile.displayName,
      createdAt: serverTimestamp(),
      entitlements: profile.entitlements,
      subscription: profile.subscription,
    },
    { merge: true }
  );

  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const data = await ensureUserProfile(currentUser);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const sendEmailLink = useCallback(async (email: string) => {
    const baseUrl = resolveActionCodeBaseUrl();
    let targetUrl = baseUrl;
    if (typeof window !== 'undefined') {
      const base = baseUrl.startsWith('http')
        ? baseUrl
        : `${window.location.origin}${baseUrl}`;
      const url = new URL(base);
      url.searchParams.set('email', email.trim());
      targetUrl = url.toString();
    }
    const actionCodeSettings = {
      url: targetUrl,
      handleCodeInApp: true,
    };
    const normalizedEmail = email.trim();
    await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', normalizedEmail);
    }
  }, []);

  const completeEmailLinkSignIn = useCallback(
    async (email: string) => {
      if (typeof window === 'undefined') {
        return null;
      }
      const result = await signInWithEmailLink(auth, email, window.location.href);
      await loadProfile(result.user);
      return result.user;
    },
    [loadProfile]
  );

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    await loadProfile(result.user);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      sendEmailLink,
      completeEmailLinkSignIn,
      signInWithGoogle,
      signOut,
      refreshProfile: async () => loadProfile(auth.currentUser),
    }),
    [user, profile, loading, sendEmailLink, completeEmailLinkSignIn, signInWithGoogle, signOut, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
