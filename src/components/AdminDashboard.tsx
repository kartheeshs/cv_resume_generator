'use client';

import { useEffect, useState } from 'react';
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserRow {
  id: string;
  email: string;
  role: string;
  createdAt?: Date;
  remainingDownloads?: number;
  plan?: string;
}

interface TemplateRow {
  id: string;
  name: string;
  description: string;
  kind: 'resume' | 'cv';
  accentColor: string;
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const userQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(userQuery, (snapshot) => {
      const rows = snapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          email: (data.email as string) ?? 'Unknown email',
          role: (data.role as string) ?? 'user',
          createdAt: (data.createdAt as Timestamp)?.toDate?.(),
          remainingDownloads: data.entitlements?.remainingDownloads,
          plan: data.entitlements?.plan,
        } satisfies UserRow;
      });
      setUsers(rows);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      const snapshot = await getDocs(collection(db, 'templates'));
      const rows: TemplateRow[] = snapshot.docs.map((document) => ({
        id: document.id,
        name: (document.data().name as string) ?? document.id,
        description: (document.data().description as string) ?? '',
        kind: (document.data().kind as 'resume' | 'cv') ?? 'resume',
        accentColor: (document.data().accentColor as string) ?? '#0f172a',
      }));
      setTemplates(rows);
    };

    loadTemplates();
  }, []);

  const updateRole = async (userId: string, nextRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: nextRole });
      setStatus(`Role updated to ${nextRole} successfully.`);
    } catch (error) {
      console.error(error);
      setStatus('Failed to update role.');
    }
  };

  const addTemplate = async (template: TemplateRow) => {
    try {
      await setDoc(doc(db, 'templates', template.id), {
        name: template.name,
        description: template.description,
        kind: template.kind,
        accentColor: template.accentColor,
      });
      setStatus('Template saved.');
    } catch (error) {
      console.error(error);
      setStatus('Unable to save template.');
    }
  };

  return (
    <section style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>Admin control center</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Manage user roles, entitlements, and resume templates. You are signed in as{' '}
          <strong>{profile?.email}</strong> with <strong>{profile?.role}</strong> privileges.
        </p>
        {status && <p style={{ marginTop: '1rem', color: '#2563eb' }}>{status}</p>}
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginTop: 0 }}>Users</h2>
          {users.length === 0 ? (
            <p>No users yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Plan</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Downloads left</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Created</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userRow) => (
                  <tr key={userRow.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.email}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.role}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.plan ?? 'free'}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{userRow.remainingDownloads ?? 0}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {userRow.createdAt ? userRow.createdAt.toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginTop: 0 }}>Templates</h2>
          <p style={{ marginTop: 0, marginBottom: '1rem', color: '#475569' }}>
            Click a template to clone its identifier, then customize and save changes.
          </p>
          {templates.length === 0 ? (
            <p>No templates yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
              {templates.map((template) => (
                <li
                  key={template.id}
                  style={{
                    border: '1px solid #cbd5f5',
                    borderRadius: '0.85rem',
                    padding: '0.85rem 1rem',
                    background: '#f8fafc',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    addTemplate({
                      ...template,
                      id: `${template.id}-copy`,
                    })
                  }
                >
                  <strong>{template.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: '#475569' }}>{template.description}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                    Kind: {template.kind.toUpperCase()} · Accent: {template.accentColor}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Tap to duplicate this template into Firestore
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
