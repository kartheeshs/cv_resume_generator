'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { ResumeDraft, ResumeTemplate } from '@/types/resume';

interface DraftFormState {
  id?: string;
  title: string;
  summary: string;
  experience: string;
  skills: string;
  templateId?: string;
}

const defaultTemplates: ResumeTemplate[] = [
  {
    id: 'modern-tech',
    name: 'Modern Tech',
    headline: 'Forward-thinking software engineer',
    defaultSummary:
      'Seasoned software engineer with a passion for creating high-quality, user-centric products across web and mobile.',
    defaultSkills: ['TypeScript', 'React', 'Next.js', 'Firebase', 'UX Collaboration'],
  },
  {
    id: 'product-lead',
    name: 'Product Lead',
    headline: 'Product leader connecting vision and execution',
    defaultSummary:
      'Product leader experienced in guiding cross-functional teams, shipping delightful experiences, and iterating with data.',
    defaultSkills: ['Roadmapping', 'User Research', 'Experimentation', 'Team Leadership'],
  },
];

async function ensureTemplatesExist() {
  const templateRef = collection(db, 'templates');
  const existing = await getDocs(templateRef);
  if (existing.empty) {
    await Promise.all(
      defaultTemplates.map((template) =>
        setDoc(doc(db, 'templates', template.id), {
          name: template.name,
          headline: template.headline,
          defaultSummary: template.defaultSummary,
          defaultSkills: template.defaultSkills,
          createdAt: serverTimestamp(),
        })
      )
    );
  }
}

export function ResumeDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const [drafts, setDrafts] = useState<ResumeDraft[]>([]);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [form, setForm] = useState<DraftFormState>({
    title: '',
    summary: '',
    experience: '',
    skills: '',
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const entitlements = profile?.entitlements;

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        await ensureTemplatesExist();
        const templateQuery = query(collection(db, 'templates'), orderBy('name', 'asc'));
        const templateSnapshot = await getDocs(templateQuery);
        setTemplates(
          templateSnapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as Omit<ResumeTemplate, 'id'>),
          }))
        );
      } catch (error) {
        console.error(error);
        setStatus('Unable to load templates from Firestore.');
      }
    };

    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const draftsQuery = query(
      collection(db, 'drafts'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(draftsQuery, (snapshot) => {
      const parsed = snapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          ownerId: data.ownerId as string,
          title: (data.title as string) ?? 'Untitled resume',
          summary: (data.summary as string) ?? '',
          experience: (data.experience as string) ?? '',
          skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
          templateId: data.templateId as string | undefined,
          updatedAt: (data.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
        } satisfies ResumeDraft;
      });
      setDrafts(parsed);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.templateId),
    [form.templateId, templates]
  );

  const resetForm = () => {
    setForm({
      id: undefined,
      title: '',
      summary: '',
      experience: '',
      skills: '',
      templateId: undefined,
    });
    setStatus(null);
  };

  const hydrateFromDraft = (draft: ResumeDraft) => {
    setForm({
      id: draft.id,
      title: draft.title,
      summary: draft.summary,
      experience: draft.experience,
      skills: draft.skills.join(', '),
      templateId: draft.templateId,
    });
  };

  const hydrateFromTemplate = (template: ResumeTemplate) => {
    setForm((previous) => ({
      ...previous,
      title: template.name,
      summary: template.defaultSummary,
      experience: template.headline,
      skills: template.defaultSkills.join(', '),
      templateId: template.id,
    }));
  };

  const saveDraft = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      setStatus('Please provide a resume title.');
      return;
    }

    try {
      const payload = {
        ownerId: user.uid,
        title: form.title,
        summary: form.summary,
        experience: form.experience,
        skills: form.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        templateId: form.templateId ?? null,
        updatedAt: serverTimestamp(),
      };

      if (form.id) {
        await setDoc(doc(db, 'drafts', form.id), payload, { merge: true });
        setStatus('Draft updated successfully.');
      } else {
        const ref = await addDoc(collection(db, 'drafts'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setForm((previous) => ({ ...previous, id: ref.id }));
        setStatus('Draft created successfully.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Unable to save draft. Please try again.');
    }
  };

  const generatePdf = async () => {
    if (!form.id) {
      setStatus('Save your draft before generating a PDF.');
      return;
    }
    if (!entitlements) {
      setStatus('Missing entitlements data. Please reload the page.');
      return;
    }
    if (entitlements.remainingDownloads <= 0 && entitlements.plan === 'free') {
      setStatus('Upgrade to a paid plan to unlock more PDF downloads.');
      return;
    }

    try {
      const payload = {
        title: form.title,
        summary: form.summary,
        experience: form.experience,
        skills: form.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        templateName: selectedTemplate?.name ?? 'Custom',
      };

      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${form.title || 'resume'}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      if (profile?.entitlements?.plan === 'free') {
        await updateDoc(doc(db, 'users', user.uid), {
          'entitlements.remainingDownloads': increment(-1),
        });
        await refreshProfile();
      }
      setStatus('PDF generated successfully.');
    } catch (error) {
      console.error(error);
      setStatus('Failed to generate PDF.');
    }
  };

  return (
    <section style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>Dashboard</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Track your entitlements, iterate on drafts, and export polished resumes on demand.
        </p>
        {entitlements && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#eef2ff', minWidth: '200px' }}>
              <strong>Plan</strong>
              <div style={{ fontSize: '1.2rem' }}>{entitlements.plan.toUpperCase()}</div>
            </div>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#ecfeff', minWidth: '200px' }}>
              <strong>Downloads left</strong>
              <div style={{ fontSize: '1.2rem' }}>{entitlements.remainingDownloads}</div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginTop: 0 }}>Resume editor</h2>
          <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '1rem' }}>
            <span>Resume title</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Product Designer Resume"
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '0.65rem',
                border: '1px solid #cbd5f5',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '1rem' }}>
            <span>Professional summary</span>
            <textarea
              value={form.summary}
              onChange={(event) => setForm((previous) => ({ ...previous, summary: event.target.value }))}
              rows={4}
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: '0.65rem',
                border: '1px solid #cbd5f5',
                resize: 'vertical',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '1rem' }}>
            <span>Experience highlights</span>
            <textarea
              value={form.experience}
              onChange={(event) => setForm((previous) => ({ ...previous, experience: event.target.value }))}
              rows={5}
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: '0.65rem',
                border: '1px solid #cbd5f5',
                resize: 'vertical',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '1rem' }}>
            <span>Skills (comma separated)</span>
            <input
              type="text"
              value={form.skills}
              onChange={(event) => setForm((previous) => ({ ...previous, skills: event.target.value }))}
              placeholder="Strategic Thinking, Leadership, Stakeholder Management"
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '0.65rem',
                border: '1px solid #cbd5f5',
              }}
            />
          </label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={saveDraft}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: '#1d4ed8',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Save draft
            </button>
            <button
              onClick={generatePdf}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid #0f172a',
                background: '#fff',
                color: '#0f172a',
                fontWeight: 600,
              }}
            >
              Generate PDF
            </button>
            <button
              onClick={resetForm}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: '#e2e8f0',
                color: '#0f172a',
                fontWeight: 600,
              }}
            >
              Reset
            </button>
          </div>
          {status && <p style={{ marginTop: '1rem', color: '#2563eb' }}>{status}</p>}
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
            <h2 style={{ marginTop: 0 }}>Drafts</h2>
            {loading ? (
              <p>Loading drafts...</p>
            ) : drafts.length === 0 ? (
              <p>No drafts yet. Save one to get started.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                {drafts.map((draft) => (
                  <li
                    key={draft.id}
                    style={{
                      border: '1px solid #cbd5f5',
                      borderRadius: '0.85rem',
                      padding: '0.85rem 1rem',
                      background: form.id === draft.id ? '#e0e7ff' : '#f8fafc',
                      cursor: 'pointer',
                    }}
                    onClick={() => hydrateFromDraft(draft)}
                  >
                    <strong>{draft.title}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                      Updated {draft.updatedAt.toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
            <h2 style={{ marginTop: 0 }}>Templates</h2>
            {templates.length === 0 ? (
              <p>Templates are loading...</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                {templates.map((template) => (
                  <li
                    key={template.id}
                    onClick={() => hydrateFromTemplate(template)}
                    style={{
                      border: '1px solid #cbd5f5',
                      borderRadius: '0.85rem',
                      padding: '0.85rem 1rem',
                      background: form.templateId === template.id ? '#dcfce7' : '#f1f5f9',
                      cursor: 'pointer',
                    }}
                  >
                    <strong>{template.name}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                      {template.headline}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
