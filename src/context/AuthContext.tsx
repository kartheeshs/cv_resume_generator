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
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const FREE_DOWNLOAD_ALLOWANCE = 1;
const PRO_WEEKLY_ALLOWANCE = 10;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

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
    nextRefreshAt?: Date | null;
    tokens?: number;
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
  signInWithPassword: (email: string, password: string) => Promise<UserProfile | null>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string | null
  ) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
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
  const shouldElevateToAdmin = isAdminEmail(user.email);

  if (snap.exists()) {
    const data = snap.data();
    const resolvedPlan = (data.entitlements?.plan as 'free' | 'pro') ?? 'free';
    const rawRemainingDownloads =
      typeof data.entitlements?.remainingDownloads === 'number'
        ? data.entitlements.remainingDownloads
        : resolvedPlan === 'pro'
        ? PRO_WEEKLY_ALLOWANCE
        : FREE_DOWNLOAD_ALLOWANCE;
    let normalizedDownloads = Math.max(0, rawRemainingDownloads);
    const tokens =
      typeof data.entitlements?.tokens === 'number' ? data.entitlements.tokens : 0;
    const rawNextRefresh = data.entitlements?.nextRefreshAt;
    let nextRefreshAt: Date | null = null;
    if (rawNextRefresh instanceof Date) {
      nextRefreshAt = rawNextRefresh;
    } else if (rawNextRefresh?.toDate) {
      nextRefreshAt = rawNextRefresh.toDate();
    }

    const now = new Date();
    let shouldPersistEntitlements = false;

    if (resolvedPlan === 'free') {
      if (normalizedDownloads > FREE_DOWNLOAD_ALLOWANCE) {
        normalizedDownloads = FREE_DOWNLOAD_ALLOWANCE;
        shouldPersistEntitlements = true;
      }
      if (nextRefreshAt !== null) {
        nextRefreshAt = null;
        shouldPersistEntitlements = true;
      }
    } else {
      const refreshDue = !nextRefreshAt || nextRefreshAt.getTime() <= now.getTime();
      if (refreshDue) {
        normalizedDownloads = Math.max(normalizedDownloads, PRO_WEEKLY_ALLOWANCE);
        nextRefreshAt = new Date(now.getTime() + WEEK_IN_MS);
        shouldPersistEntitlements = true;
      }
    }

    if (typeof data.entitlements?.tokens !== 'number') {
      shouldPersistEntitlements = true;
    }

    if (shouldPersistEntitlements) {
      const entitlementsPayload: Record<string, unknown> = {
        ...(data.entitlements ?? {}),
        plan: resolvedPlan,
        remainingDownloads: normalizedDownloads,
        tokens,
        nextRefreshAt: nextRefreshAt ? Timestamp.fromDate(nextRefreshAt) : null,
      };
      await setDoc(
        ref,
        {
          entitlements: entitlementsPayload,
        },
        { merge: true }
      );
    }

    const entitlementsData: UserProfile['entitlements'] = {
      plan: resolvedPlan,
      remainingDownloads: normalizedDownloads,
      tokens,
      nextRefreshAt,
    };
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
    let resolvedRole: UserRole = (data.role as UserRole) ?? 'user';
    if (shouldElevateToAdmin && resolvedRole !== 'admin') {
      resolvedRole = 'admin';
      await setDoc(ref, { role: resolvedRole }, { merge: true });
    }

    return {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName,
      role: resolvedRole,
      createdAt: data.createdAt?.toDate?.(),
      entitlements: entitlementsData,
      stripeCustomerId: data.stripeCustomerId as string | undefined,
      subscription: subscriptionData,
    };
  }

  const defaultRole: UserRole = shouldElevateToAdmin ? 'admin' : 'user';
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
    role: defaultRole,
    createdAt: new Date(),
    entitlements: {
      plan: 'free',
      remainingDownloads: FREE_DOWNLOAD_ALLOWANCE,
      tokens: 0,
      nextRefreshAt: null,
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
      return null;
    }
    try {
      const data = await ensureUserProfile(currentUser);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Failed to load profile', error);
      return null;
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

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim();
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      return loadProfile(result.user);
    },
    [loadProfile]
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, displayName?: string | null) => {
      const normalizedEmail = email.trim();
      const result = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      if (displayName) {
        try {
          await updateProfile(result.user, { displayName });
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Failed to set display name', error);
          }
        }
      }
      return loadProfile(result.user);
    },
    [loadProfile]
  );

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
      signInWithPassword,
      signUpWithPassword,
      signOut,
      refreshProfile: async () => loadProfile(auth.currentUser),
    }),
    [
      user,
      profile,
      loading,
      sendEmailLink,
      completeEmailLinkSignIn,
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      loadProfile,
    ]
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
