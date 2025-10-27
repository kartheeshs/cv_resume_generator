'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { CareerStudioLogo } from './CareerStudioLogo';
import { useLocalization, formatMessage } from '@/context/LocalizationContext';

type AdminTab = 'overview' | 'users' | 'downloads' | 'subscriptions' | 'templates';

const FREE_DOWNLOAD_ALLOWANCE = 1;
const PRO_WEEKLY_ALLOWANCE = 10;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

interface UserRow {
  id: string;
  email: string;
  role: string;
  createdAt?: Date;
  remainingDownloads?: number;
  tokens?: number;
  nextRefreshAt?: Date | null;
  plan?: 'free' | 'pro';
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  subscriptionPeriodEnd?: Date | null;
}

interface DownloadRow {
  id: string;
  userId: string;
  documentTitle: string;
  templateId: string;
  language?: string;
  plan?: string;
  createdAt?: Date;
}

interface TemplateRow {
  id: string;
  name: string;
  description: string;
  kind: 'resume' | 'cv';
  accentColor: string;
}

function formatDate(value?: Date | null) {
  return value ? value.toLocaleDateString() : '—';
}

function formatDateTime(value?: Date) {
  return value ? value.toLocaleString() : '—';
}

export function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const { copy } = useLocalization();
  const adminCopy = copy.adminDashboard;
  const tabs = adminCopy.tabs as { id: AdminTab; label: string; description: string }[];
  const [users, setUsers] = useState<UserRow[]>([]);
  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null);
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [grantingTokensId, setGrantingTokensId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const activeTabDefinition = tabs.find((tab) => tab.id === activeTab);

  useEffect(() => {
    const userQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(userQuery, (snapshot) => {
      const rows = snapshot.docs.map((document) => {
        const data = document.data();
        const subscriptionStatus = data.subscription?.status as string | undefined;
        const periodEnd = (data.subscription?.currentPeriodEnd as Timestamp | undefined)?.toDate?.() ?? null;
        const tokens =
          typeof data.entitlements?.tokens === 'number' ? data.entitlements.tokens : 0;
        const rawNextRefresh = data.entitlements?.nextRefreshAt;
        let nextRefreshAt: Date | null = null;
        if (rawNextRefresh) {
          if (typeof rawNextRefresh.toDate === 'function') {
            nextRefreshAt = rawNextRefresh.toDate();
          } else if (rawNextRefresh instanceof Date) {
            nextRefreshAt = rawNextRefresh;
          }
        }
        return {
          id: document.id,
          email: (data.email as string) ?? 'Unknown email',
          role: (data.role as string) ?? 'user',
          createdAt: (data.createdAt as Timestamp)?.toDate?.(),
          remainingDownloads: data.entitlements?.remainingDownloads,
          tokens,
          nextRefreshAt,
          plan: data.entitlements?.plan,
          stripeCustomerId: data.stripeCustomerId as string | undefined,
          subscriptionStatus,
          subscriptionPeriodEnd: periodEnd,
        } satisfies UserRow;
      });
      setUsers(rows);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const downloadsQuery = query(
      collection(db, 'downloads'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      downloadsQuery,
      (snapshot) => {
        const rows: DownloadRow[] = snapshot.docs.map((document) => {
          const data = document.data();
          return {
            id: document.id,
            userId: (data.userId as string) ?? 'unknown-user',
            documentTitle: (data.documentTitle as string) ?? 'Untitled document',
            templateId: (data.templateId as string) ?? 'unknown-template',
            language: data.language as string | undefined,
            plan: data.plan as string | undefined,
            createdAt: (data.createdAt as Timestamp | undefined)?.toDate?.(),
          };
        });
        setDownloads(rows);
        setLoadingDownloads(false);
      },
      (error) => {
        console.error('Failed to load downloads', error);
        setStatus(adminCopy.statuses.downloadsFailed);
        setLoadingDownloads(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'templates'));
        const rows: TemplateRow[] = snapshot.docs.map((document) => ({
          id: document.id,
          name: (document.data().name as string) ?? document.id,
          description: (document.data().description as string) ?? '',
          kind: (document.data().kind as 'resume' | 'cv') ?? 'resume',
          accentColor: (document.data().accentColor as string) ?? '#0f172a',
        }));
        setTemplates(rows);
      } catch (error) {
        console.error('Failed to load templates', error);
        setStatus(adminCopy.statuses.templatesFailed);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  const userMap = useMemo(() => {
    const map = new Map<string, UserRow>();
    users.forEach((userRow) => {
      map.set(userRow.id, userRow);
    });
    return map;
  }, [users]);

  const totalUsers = users.length;
  const proUsers = useMemo(() => users.filter((userRow) => userRow.plan === 'pro').length, [users]);
  const downloadsLast30Days = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return downloads.filter((download) => download.createdAt && download.createdAt >= cutoff).length;
  }, [downloads]);
  const totalDownloads = downloads.length;
  const recentDownloads = useMemo(() => downloads.slice(0, 8), [downloads]);
  const overviewCopy = formatMessage(adminCopy.overviewCopy, {
    email: profile?.email ?? adminCopy.roleLabel,
  });
  const metricValues: Record<'totalUsers' | 'proUsers' | 'downloads30' | 'totalDownloads', number> = {
    totalUsers,
    proUsers,
    downloads30: downloadsLast30Days,
    totalDownloads,
  };
  const overviewTab = tabs.find((tab) => tab.id === 'overview');
  const usersTab = tabs.find((tab) => tab.id === 'users');
  const downloadsTab = tabs.find((tab) => tab.id === 'downloads');
  const subscriptionsTab = tabs.find((tab) => tab.id === 'subscriptions');
  const templatesTab = tabs.find((tab) => tab.id === 'templates');

  const updateRole = async (userId: string, nextRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: nextRole });
      setStatus(formatMessage(adminCopy.statuses.roleUpdated, { role: nextRole }));
    } catch (error) {
      console.error(error);
      setStatus(adminCopy.statuses.roleUpdateFailed);
    }
  };

  const adjustDownloads = async (userId: string, delta: number) => {
    try {
      setAdjustingUserId(userId);
      await updateDoc(doc(db, 'users', userId), {
        'entitlements.remainingDownloads': increment(delta),
      });
      const deltaLabel = `${delta > 0 ? '+' : ''}${delta}`;
      setStatus(formatMessage(adminCopy.statuses.adjustSuccess, { delta: deltaLabel }));
    } catch (error) {
      console.error(error);
      setStatus(adminCopy.statuses.adjustFailed);
    } finally {
      setAdjustingUserId(null);
    }
  };

  const resetDownloads = async (user: UserRow) => {
    try {
      setResettingUserId(user.id);
      const allowance = user.plan === 'pro' ? PRO_WEEKLY_ALLOWANCE : FREE_DOWNLOAD_ALLOWANCE;
      const updates: Record<string, unknown> = {
        'entitlements.remainingDownloads': allowance,
        'entitlements.nextRefreshAt':
          user.plan === 'pro'
            ? Timestamp.fromDate(new Date(Date.now() + WEEK_IN_MS))
            : null,
      };
      await updateDoc(doc(db, 'users', user.id), {
        ...updates,
      });
      setStatus(formatMessage(adminCopy.statuses.resetSuccess, { allowance }));
    } catch (error) {
      console.error(error);
      setStatus(adminCopy.statuses.resetFailed);
    } finally {
      setResettingUserId(null);
    }
  };

  const setPlan = async (userId: string, plan: 'free' | 'pro') => {
    try {
      const updates: Record<string, unknown> = {
        'entitlements.plan': plan,
      };
      if (plan === 'pro') {
        updates['entitlements.remainingDownloads'] = PRO_WEEKLY_ALLOWANCE;
        updates['entitlements.nextRefreshAt'] = Timestamp.fromDate(new Date(Date.now() + WEEK_IN_MS));
      } else {
        updates['entitlements.remainingDownloads'] = FREE_DOWNLOAD_ALLOWANCE;
        updates['entitlements.nextRefreshAt'] = null;
      }
      await updateDoc(doc(db, 'users', userId), updates);
      setStatus(formatMessage(adminCopy.statuses.planUpdated, { plan }));
    } catch (error) {
      console.error(error);
      setStatus(adminCopy.statuses.planFailed);
    }
  };

  const grantTokens = async (userId: string, amount: number) => {
    try {
      setGrantingTokensId(userId);
      await updateDoc(doc(db, 'users', userId), {
        'entitlements.tokens': increment(amount),
      });
      setStatus(formatMessage(adminCopy.statuses.tokensGranted, { count: amount }));
    } catch (error) {
      console.error(error);
      setStatus(adminCopy.statuses.tokensGrantFailed);
    } finally {
      setGrantingTokensId(null);
    }
  };

  const syncSubscription = async (userId: string) => {
    try {
      setSyncingUserId(userId);
      await new Promise((resolve) => setTimeout(resolve, 320));
      setStatus(adminCopy.statuses.subscriptionRefreshed);
    } catch (error) {
      console.error('Demo subscription refresh failed', error);
      setStatus(adminCopy.statuses.subscriptionFailed);
    } finally {
      setSyncingUserId(null);
    }
  };

  const duplicateTemplate = async (template: TemplateRow) => {
    try {
      await setDoc(doc(db, 'templates', `${template.id}-copy`), {
        name: `${template.name} (Copy)`,
        description: template.description,
        kind: template.kind,
        accentColor: template.accentColor,
        createdAt: Timestamp.now(),
      });
      setStatus(adminCopy.statuses.templateDuplicated);
      setTemplates((previous) => [
        ...previous,
        {
          ...template,
          id: `${template.id}-copy`,
          name: `${template.name} (Copy)`,
        },
      ]);
    } catch (error) {
      console.error(error);
      setStatus(adminCopy.statuses.templatesFailed);
    }
  };

  const deleteUserAccount = async (user: UserRow) => {
    const confirmation = window.confirm(
      formatMessage(adminCopy.confirmations.deleteUser, { email: user.email })
    );
    if (!confirmation) return;

    try {
      setDeletingUserId(user.id);
      let emailSent = true;

      try {
        const response = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email }),
        });

        if (!response.ok) {
          emailSent = false;
        } else {
          const payload: { emailSent?: boolean } = await response.json().catch(() => ({}));
          if (payload.emailSent === false) {
            emailSent = false;
          }
        }
      } catch (error) {
        console.error('Failed to send deletion email', error);
        emailSent = false;
      }

      await deleteDoc(doc(db, 'users', user.id));

      setStatus(
        emailSent ? adminCopy.statuses.userDeleted : adminCopy.statuses.userDeleteEmailFailed
      );
    } catch (error) {
      console.error('Failed to delete user account', error);
      setStatus(adminCopy.statuses.userDeleteFailed);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(248, 250, 252, 0.94)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.28)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1rem 1.75rem 1.15rem',
            display: 'grid',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <CareerStudioLogo variant="inline" markSize={38} />
              <div style={{ display: 'grid', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 700, letterSpacing: '0.01em', color: '#0f172a' }}>
                  {adminCopy.headerTitle}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{adminCopy.headerSubtitle}</span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  background: '#f1f5f9',
                  borderRadius: '0.9rem',
                  padding: '0.45rem 0.85rem',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                }}
              >
                <svg
                  aria-hidden
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.5 3.5a6 6 0 104.243 10.243l2.628 2.629a1 1 0 001.415-1.415l-2.629-2.628A6 6 0 009.5 3.5z"
                    stroke="#475569"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="search"
                  placeholder={adminCopy.searchPlaceholder}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    minWidth: '180px',
                  }}
                />
              </label>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: '#0ea5e9',
                  color: '#fff',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.9rem',
                  fontWeight: 600,
                  boxShadow: '0 16px 32px -24px rgba(14, 165, 233, 0.65)',
                  cursor: 'pointer',
                }}
              >
                {adminCopy.createReport}
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                style={{
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  background: '#fff',
                  color: '#2563eb',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {adminCopy.signOut}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                flexWrap: 'wrap',
              }}
            >
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: isActive ? '#1d4ed8' : '#475569',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '0.8rem',
                      fontWeight: 600,
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        right: '0.75rem',
                        bottom: '-0.35rem',
                        height: isActive ? '3px' : '1px',
                        background: isActive ? '#2563eb' : 'rgba(148, 163, 184, 0.5)',
                        borderRadius: '999px',
                        transition: 'height 0.2s ease, background 0.2s ease',
                      }}
                    />
                  </button>
                );
              })}
            </nav>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{activeTabDefinition?.description}</span>
          </div>
        </div>
      </header>

      <main
        style={{
          flex: '1 1 auto',
          width: '100%',
          padding: '2rem 1.5rem 3rem',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
          <div
            style={{
              background: '#fff',
              padding: '1.75rem',
              borderRadius: '1.25rem',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 26px 65px -40px rgba(15, 23, 42, 0.3)',
              display: 'grid',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.65rem',
                flexWrap: 'wrap',
                fontSize: '0.85rem',
                color: '#475569',
              }}
            >
              <span
                style={{
                  background: '#f1f5f9',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.65rem',
                  fontWeight: 600,
                  color: '#1e3a8a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>{adminCopy.roleLabel}:</span>
                <span>{profile?.role ?? 'user'}</span>
              </span>
            </div>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {adminCopy.badge}
                </span>
                <span style={{ color: '#64748b' }}>{adminCopy.badgeDescriptor}</span>
              </div>
              <h1 style={{ margin: 0, fontSize: '2.1rem', color: '#0f172a' }}>{adminCopy.overviewTitle}</h1>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{overviewCopy}</p>
            </div>
            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              {adminCopy.metrics.map((metric) => {
                const value = metricValues[metric.valueKey] ?? 0;
                const footer =
                  metric.valueKey === 'proUsers'
                    ? adminCopy.metricFooters.proUsers
                    : metric.valueKey === 'downloads30'
                    ? adminCopy.metricFooters.downloads30
                    : null;
                return (
                  <div
                    key={metric.valueKey}
                    style={{
                      borderRadius: '0.9rem',
                      padding: '0.85rem 1rem',
                      background: '#f8fafc',
                      border: '1px solid rgba(226, 232, 240, 0.7)',
                      display: 'grid',
                      gap: '0.35rem',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                      {value.toLocaleString()}
                    </span>
                    <span style={{ color: '#475569', fontWeight: 600 }}>{metric.label}</span>
                    {footer ? <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{footer}</span> : null}
                  </div>
                );
              })}
            </div>
            {status && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.9rem',
                  background: 'rgba(14, 165, 233, 0.12)',
                  color: '#0369a1',
                  fontWeight: 500,
                }}
              >
                {status}
              </div>
            )}
          </div>

      {activeTab === 'overview' && (
        <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'grid', gap: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{overviewTab?.label ?? adminCopy.overviewTitle}</h2>
            {overviewTab?.description ? (
              <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{overviewTab.description}</p>
            ) : null}
          </div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {adminCopy.metrics.map((metric) => {
              const value = metricValues[metric.valueKey] ?? 0;
              const footer =
                metric.valueKey === 'proUsers'
                  ? adminCopy.metricFooters.proUsers
                  : metric.valueKey === 'downloads30'
                  ? adminCopy.metricFooters.downloads30
                  : null;
              return (
                <div
                  key={`overview-${metric.valueKey}`}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.9rem',
                    padding: '1.1rem',
                    background: '#f8fafc',
                    display: 'grid',
                    gap: '0.35rem',
                  }}
                >
                  <strong style={{ fontSize: '1.65rem' }}>{value.toLocaleString()}</strong>
                  <span style={{ color: '#475569' }}>{metric.label}</span>
                  {footer ? <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{footer}</span> : null}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>{adminCopy.downloadsHeading}</h3>
            {recentDownloads.length === 0 ? (
              <p style={{ color: '#64748b' }}>{adminCopy.downloadsEmpty}</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.document}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.user}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.template}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.language}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.plan}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.created}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDownloads.map((download) => {
                    const userRow = userMap.get(download.userId);
                    return (
                      <tr key={download.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{download.documentTitle}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{userRow?.email ?? download.userId}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{download.templateId}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{download.language ?? '—'}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{(download.plan ?? userRow?.plan ?? 'free').toUpperCase()}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{formatDateTime(download.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'grid', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{adminCopy.usersHeading}</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{usersTab?.description ?? adminCopy.usersCopy}</p>
          </div>
          {users.length === 0 ? (
            <p style={{ color: '#64748b' }}>{adminCopy.usersEmpty}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.email}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.role}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.plan}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.remainingDownloads}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.tokens}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.nextRefresh}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.subscriptionStatus}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.createdAt}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.usersColumns.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userRow) => (
                    <tr key={userRow.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{userRow.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.role}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{(userRow.plan ?? 'free').toUpperCase()}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.remainingDownloads ?? 0}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.tokens ?? 0}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{formatDateTime(userRow.nextRefreshAt ?? undefined)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.subscriptionStatus ?? '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{formatDate(userRow.createdAt)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => updateRole(userRow.id, 'user')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #94a3b8',
                              background: '#fff',
                              fontWeight: 600,
                            }}
                          >
                            {adminCopy.buttons.setUser}
                          </button>
                          <button
                            onClick={() => updateRole(userRow.id, 'admin')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #1d4ed8',
                              background: '#1d4ed8',
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          >
                            {adminCopy.buttons.setAdmin}
                          </button>
                          {userRow.plan === 'pro' && (
                            <button
                              onClick={() => adjustDownloads(userRow.id, 10)}
                              disabled={adjustingUserId === userRow.id}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #16a34a',
                                background: adjustingUserId === userRow.id ? '#bbf7d0' : '#22c55e',
                                color: adjustingUserId === userRow.id ? '#166534' : '#fff',
                                fontWeight: 600,
                              }}
                            >
                              {adjustingUserId === userRow.id
                                ? `${adminCopy.buttons.addDownloads}…`
                                : adminCopy.buttons.addDownloads}
                            </button>
                          )}
                          <button
                            onClick={() => grantTokens(userRow.id, 5)}
                            disabled={grantingTokensId === userRow.id}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #a855f7',
                              background: grantingTokensId === userRow.id ? '#e9d5ff' : '#a855f7',
                              color: grantingTokensId === userRow.id ? '#6b21a8' : '#fff',
                              fontWeight: 600,
                            }}
                          >
                            {grantingTokensId === userRow.id
                              ? `${adminCopy.buttons.addTokens}…`
                              : adminCopy.buttons.addTokens}
                          </button>
                          <button
                            onClick={() => resetDownloads(userRow)}
                            disabled={resettingUserId === userRow.id}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #0ea5e9',
                              background: resettingUserId === userRow.id ? '#bae6fd' : '#38bdf8',
                              color: resettingUserId === userRow.id ? '#0c4a6e' : '#0f172a',
                              fontWeight: 600,
                            }}
                          >
                            {resettingUserId === userRow.id
                              ? adminCopy.buttons.resetDownloadsLoading
                              : adminCopy.buttons.resetDownloads}
                          </button>
                          <button
                            onClick={() => setPlan(userRow.id, userRow.plan === 'pro' ? 'free' : 'pro')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #0f172a',
                              background: '#fff',
                              fontWeight: 600,
                            }}
                          >
                            {userRow.plan === 'pro'
                              ? adminCopy.buttons.setPlanToFree
                              : adminCopy.buttons.setPlanToPro}
                          </button>
                          <button
                            onClick={() => syncSubscription(userRow.id)}
                            disabled={syncingUserId === userRow.id}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #2563eb',
                              background: syncingUserId === userRow.id ? '#bfdbfe' : '#2563eb',
                              color: syncingUserId === userRow.id ? '#1e3a8a' : '#fff',
                              fontWeight: 600,
                            }}
                          >
                            {syncingUserId === userRow.id
                              ? adminCopy.buttons.refreshStatusLoading
                              : adminCopy.buttons.refreshStatus}
                          </button>
                          <button
                            onClick={() => deleteUserAccount(userRow)}
                            disabled={deletingUserId === userRow.id}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #ef4444',
                              background: deletingUserId === userRow.id ? '#fecaca' : '#ef4444',
                              color: deletingUserId === userRow.id ? '#991b1b' : '#fff',
                              fontWeight: 600,
                            }}
                          >
                            {deletingUserId === userRow.id
                              ? adminCopy.buttons.deleteUserLoading
                              : adminCopy.buttons.deleteUser}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'downloads' && (
        <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'grid', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{adminCopy.downloadsHeading}</h2>
            {downloadsTab?.description ? (
              <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{downloadsTab.description}</p>
            ) : null}
          </div>
          {loadingDownloads ? (
            <p style={{ color: '#64748b' }}>{adminCopy.downloadsLoading}</p>
          ) : downloads.length === 0 ? (
            <p style={{ color: '#64748b' }}>{adminCopy.downloadsEmpty}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.document}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.user}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.template}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.language}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.plan}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.downloadsColumns.created}</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map((download) => {
                    const userRow = userMap.get(download.userId);
                    return (
                      <tr key={download.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{download.documentTitle}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{userRow?.email ?? download.userId}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{download.templateId}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{download.language ?? '—'}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{(download.plan ?? userRow?.plan ?? 'free').toUpperCase()}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{formatDateTime(download.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'subscriptions' && (
        <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'grid', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{subscriptionsTab?.label ?? 'Subscriptions'}</h2>
            {subscriptionsTab?.description ? (
              <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{subscriptionsTab.description}</p>
            ) : null}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.subscriptionsColumns.email}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.subscriptionsColumns.customer}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.subscriptionsColumns.plan}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.subscriptionsColumns.status}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.subscriptionsColumns.periodEnd}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.subscriptionsColumns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((userRow) => userRow.stripeCustomerId || userRow.plan === 'pro')
                  .map((userRow) => (
                    <tr key={userRow.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.stripeCustomerId ?? '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{(userRow.plan ?? 'free').toUpperCase()}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.subscriptionStatus ?? '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{formatDate(userRow.subscriptionPeriodEnd)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button
                          onClick={() => syncSubscription(userRow.id)}
                          disabled={syncingUserId === userRow.id}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #2563eb',
                            background: syncingUserId === userRow.id ? '#bfdbfe' : '#2563eb',
                            color: syncingUserId === userRow.id ? '#1e3a8a' : '#fff',
                          }}
                        >
                          {syncingUserId === userRow.id
                            ? adminCopy.buttons.refreshStatusLoading
                            : adminCopy.buttons.refreshStatus}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'templates' && (
        <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'grid', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{adminCopy.templatesHeading}</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{templatesTab?.description ?? adminCopy.templatesCopy}</p>
          </div>
          {loadingTemplates ? (
            <p style={{ color: '#64748b' }}>{adminCopy.templatesLoading}</p>
          ) : templates.length === 0 ? (
            <p style={{ color: '#64748b' }}>{adminCopy.templatesEmpty}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.templatesColumns.name}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.templatesColumns.kind}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.templatesColumns.description}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.templatesColumns.accent}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{adminCopy.templatesColumns.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{template.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{template.kind.toUpperCase()}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{template.description || '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{template.accentColor}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => duplicateTemplate(template)}
                          style={{
                            padding: '0.4rem 0.9rem',
                            borderRadius: '0.65rem',
                            border: '1px solid #2563eb',
                            background: '#2563eb',
                            color: '#fff',
                            fontWeight: 600,
                          }}
                        >
                          {adminCopy.duplicateTemplate}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
        </div>
      </main>
    </div>
  );
}
