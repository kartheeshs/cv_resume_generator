'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
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

type AdminTab = 'overview' | 'users' | 'downloads' | 'subscriptions' | 'templates';

const ADMIN_TABS: { id: AdminTab; label: string; description: string }[] = [
  { id: 'overview', label: 'Overview', description: 'Metrics and recent activity.' },
  { id: 'users', label: 'Users', description: 'Manage roles and entitlements.' },
  { id: 'downloads', label: 'Downloads', description: 'Audit generated documents.' },
  { id: 'subscriptions', label: 'Subscriptions', description: 'Review paid customers.' },
  { id: 'templates', label: 'Templates', description: 'Organize available layouts.' },
];

interface UserRow {
  id: string;
  email: string;
  role: string;
  createdAt?: Date;
  remainingDownloads?: number;
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
  const [users, setUsers] = useState<UserRow[]>([]);
  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null);
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const activeTabDefinition = ADMIN_TABS.find((tab) => tab.id === activeTab);

  useEffect(() => {
    const userQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(userQuery, (snapshot) => {
      const rows = snapshot.docs.map((document) => {
        const data = document.data();
        const subscriptionStatus = data.subscription?.status as string | undefined;
        const periodEnd = (data.subscription?.currentPeriodEnd as Timestamp | undefined)?.toDate?.() ?? null;
        return {
          id: document.id,
          email: (data.email as string) ?? 'Unknown email',
          role: (data.role as string) ?? 'user',
          createdAt: (data.createdAt as Timestamp)?.toDate?.(),
          remainingDownloads: data.entitlements?.remainingDownloads,
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
        setStatus('Unable to load downloads from Firestore.');
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
        setStatus('Unable to load templates.');
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

  const updateRole = async (userId: string, nextRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: nextRole });
      setStatus(`Role updated to ${nextRole} successfully.`);
    } catch (error) {
      console.error(error);
      setStatus('Failed to update role.');
    }
  };

  const adjustDownloads = async (userId: string, delta: number) => {
    try {
      setAdjustingUserId(userId);
      await updateDoc(doc(db, 'users', userId), {
        'entitlements.remainingDownloads': increment(delta),
      });
      setStatus(`Adjusted downloads by ${delta > 0 ? '+' : ''}${delta}.`);
    } catch (error) {
      console.error(error);
      setStatus('Unable to adjust download allowance.');
    } finally {
      setAdjustingUserId(null);
    }
  };

  const resetDownloads = async (user: UserRow) => {
    try {
      setResettingUserId(user.id);
      const allowance = user.plan === 'pro' ? 50 : 1;
      await updateDoc(doc(db, 'users', user.id), {
        'entitlements.remainingDownloads': allowance,
      });
      setStatus(`Download allowance reset to ${allowance}.`);
    } catch (error) {
      console.error(error);
      setStatus('Failed to reset download allowance.');
    } finally {
      setResettingUserId(null);
    }
  };

  const setPlan = async (userId: string, plan: 'free' | 'pro') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        'entitlements.plan': plan,
      });
      setStatus(`Plan updated to ${plan}.`);
    } catch (error) {
      console.error(error);
      setStatus('Failed to update plan.');
    }
  };

  const syncSubscription = async (userId: string) => {
    try {
      setSyncingUserId(userId);
      await new Promise((resolve) => setTimeout(resolve, 320));
      setStatus('Subscription status refreshed (demo mode).');
    } catch (error) {
      console.error('Demo subscription refresh failed', error);
      setStatus('Unable to refresh the subscription status right now.');
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
      setStatus('Template duplicated successfully.');
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
      setStatus('Unable to duplicate template.');
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
          background: 'rgba(248, 250, 252, 0.92)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.3)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1.1rem 1.75rem',
            display: 'grid',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                aria-hidden
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '1.1rem',
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(79,70,229,0.2))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1d4ed8',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                GM
              </span>
              <div style={{ display: 'grid', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 700, letterSpacing: '0.01em', color: '#0f172a' }}>Career Studio GM7</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', letterSpacing: '0.08em' }}>Admin Console</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              style={{
                border: '1px solid rgba(37, 99, 235, 0.3)',
                background: '#2563eb',
                color: '#fff',
                padding: '0.55rem 1.2rem',
                borderRadius: '0.8rem',
                fontWeight: 600,
                boxShadow: '0 12px 28px -20px rgba(37, 99, 235, 0.45)',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              {ADMIN_TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '0.75rem 1rem',
                      fontWeight: 600,
                      color: isActive ? '#0f172a' : '#64748b',
                      borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                      borderRadius: '0.6rem 0.6rem 0 0',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            {activeTabDefinition && (
              <span style={{ color: '#475569', fontSize: '0.85rem' }}>{activeTabDefinition.description}</span>
            )}
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
              padding: '1.5rem',
              borderRadius: '1rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 24px 60px -35px rgba(15, 23, 42, 0.22)',
            }}
          >
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', color: '#0f172a' }}>Admin control center</h1>
            <p style={{ margin: 0, color: '#475569' }}>
              Manage users, downloads, and subscriptions. Signed in as <strong>{profile?.email}</strong> with
              <strong> {profile?.role}</strong> access.
            </p>
            <p style={{ margin: '0.5rem 0 0', color: '#6366f1', fontWeight: 500 }}>
              Stripe automation is running in demo mode—actions here simulate the real billing flows.
            </p>
            {status && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.9rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  color: '#1d4ed8',
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
            <h2 style={{ margin: 0 }}>Operational snapshot</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{ADMIN_TABS.find((tab) => tab.id === 'overview')?.description}</p>
          </div>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[{
              label: 'Total users',
              value: totalUsers.toLocaleString(),
            },
            {
              label: 'Pro subscribers',
              value: proUsers.toLocaleString(),
            },
            {
              label: 'Downloads (30 days)',
              value: downloadsLast30Days.toLocaleString(),
            },
            {
              label: 'All-time downloads',
              value: totalDownloads.toLocaleString(),
            }].map((card) => (
              <div
                key={card.label}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.9rem',
                  padding: '1.1rem',
                  background: '#f8fafc',
                  display: 'grid',
                  gap: '0.35rem',
                }}
              >
                <strong style={{ fontSize: '1.65rem' }}>{card.value}</strong>
                <span style={{ color: '#475569' }}>{card.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Latest downloads</h3>
            {recentDownloads.length === 0 ? (
              <p style={{ color: '#64748b' }}>No downloads recorded yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Document</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>User</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Template</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Plan</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Generated</th>
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
            <h2 style={{ margin: 0 }}>User management</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{ADMIN_TABS.find((tab) => tab.id === 'users')?.description}</p>
          </div>
          {users.length === 0 ? (
            <p>No users yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Plan</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Downloads left</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Subscription status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Joined</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userRow) => (
                    <tr key={userRow.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.role}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{(userRow.plan ?? 'free').toUpperCase()}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.remainingDownloads ?? 0}</td>
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
                            }}
                          >
                            Set user
                          </button>
                          <button
                            onClick={() => updateRole(userRow.id, 'admin')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #1d4ed8',
                              background: '#1d4ed8',
                              color: '#fff',
                            }}
                          >
                            Set admin
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
                              }}
                            >
                              {adjustingUserId === userRow.id ? 'Updating…' : '+10 downloads'}
                            </button>
                          )}
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
                            {resettingUserId === userRow.id ? 'Resetting…' : 'Reset allowance'}
                          </button>
                          <button
                            onClick={() => setPlan(userRow.id, userRow.plan === 'pro' ? 'free' : 'pro')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #0f172a',
                              background: '#fff',
                            }}
                          >
                            Set {userRow.plan === 'pro' ? 'free' : 'pro'} plan
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
                            }}
                          >
                            {syncingUserId === userRow.id ? 'Syncing…' : 'Refresh status'}
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
            <h2 style={{ margin: 0 }}>Download history</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{ADMIN_TABS.find((tab) => tab.id === 'downloads')?.description}</p>
          </div>
          {loadingDownloads ? (
            <p style={{ color: '#64748b' }}>Loading downloads…</p>
          ) : downloads.length === 0 ? (
            <p style={{ color: '#64748b' }}>No downloads recorded yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Document</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>User</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Template</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Language</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Plan</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Created</th>
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
            <h2 style={{ margin: 0 }}>Subscriptions</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{ADMIN_TABS.find((tab) => tab.id === 'subscriptions')?.description}</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Customer reference</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Plan</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Period end</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
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
                          {syncingUserId === userRow.id ? 'Syncing…' : 'Refresh status'}
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
                <h2 style={{ margin: 0 }}>Templates</h2>
                <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{ADMIN_TABS.find((tab) => tab.id === 'templates')?.description}</p>
              </div>
              {loadingTemplates ? (
                <p style={{ color: '#64748b' }}>Loading templates…</p>
              ) : templates.length === 0 ? (
                <p style={{ color: '#64748b' }}>No templates available.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                  {templates.map((template) => (
                    <li
                      key={template.id}
                      style={{
                        border: '1px solid #cbd5f5',
                        borderRadius: '0.85rem',
                        padding: '1rem',
                        background: '#f8fafc',
                        display: 'grid',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '1.1rem' }}>{template.name}</strong>
                        <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.35rem' }}>{template.description}</div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Kind: {template.kind.toUpperCase()} · Accent: {template.accentColor}
                      </div>
                      <button
                        type="button"
                        onClick={() => duplicateTemplate(template)}
                        style={{
                          justifySelf: 'start',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid #2563eb',
                          background: '#2563eb',
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      >
                        Duplicate template
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
