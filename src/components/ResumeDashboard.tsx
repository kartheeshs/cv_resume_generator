'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  ListSection,
  ResumeDraft,
  ResumeDraftContent,
  ResumeTemplate,
  SkillGroup,
} from '@/types/resume';
import { getResumeTemplateDefinition, resumeTemplateDefinitions, resumeTemplateMetadata } from '@/templates/resume/definitions';

interface DraftFormState extends ResumeDraftContent {
  id?: string;
  templateId: string;
}

function deepClone<T>(value: T): T {
  const clone = (globalThis as typeof globalThis & { structuredClone?: <U>(input: U) => U }).structuredClone;
  if (typeof clone === 'function') {
    return clone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function emptyExperience(): ExperienceEntry {
  return {
    id: createId('exp'),
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    bullets: [''],
  };
}

function emptyEducation(): EducationEntry {
  return {
    id: createId('edu'),
    school: '',
    degree: '',
    location: '',
    startDate: '',
    endDate: '',
  };
}

function emptySkillGroup(): SkillGroup {
  return {
    id: createId('skills'),
    title: '',
    skills: [],
    placement: 'main',
  };
}

function emptyListSection(): ListSection {
  return {
    id: createId('list'),
    title: '',
    items: [],
    placement: 'sidebar',
  };
}

function emptyCertification(): CertificationEntry {
  return {
    id: createId('cert'),
    name: '',
    organization: '',
    date: '',
  };
}

function parseExperiences(value: unknown, fallback: ExperienceEntry[]): ExperienceEntry[] {
  if (!Array.isArray(value)) return fallback;
  return (value as ExperienceEntry[]).map((experience, index) => ({
    id: experience.id ?? createId(`exp-${index}`),
    title: experience.title ?? '',
    company: experience.company ?? '',
    location: experience.location ?? '',
    startDate: experience.startDate ?? '',
    endDate: experience.endDate ?? '',
    bullets: Array.isArray(experience.bullets)
      ? experience.bullets.filter((bullet) => typeof bullet === 'string')
      : [],
    category: experience.category,
  }));
}

function parseEducation(value: unknown, fallback: EducationEntry[]): EducationEntry[] {
  if (!Array.isArray(value)) return fallback;
  return (value as EducationEntry[]).map((entry, index) => ({
    id: entry.id ?? createId(`edu-${index}`),
    school: entry.school ?? '',
    degree: entry.degree ?? '',
    location: entry.location ?? '',
    startDate: entry.startDate ?? '',
    endDate: entry.endDate ?? '',
    details: Array.isArray(entry.details)
      ? entry.details.filter((detail) => typeof detail === 'string')
      : [],
  }));
}

function parseSkillGroups(value: unknown, fallback: SkillGroup[]): SkillGroup[] {
  if (!Array.isArray(value)) return fallback;
  return (value as SkillGroup[]).map((group, index) => ({
    id: group.id ?? createId(`skills-${index}`),
    title: group.title ?? '',
    skills: Array.isArray(group.skills)
      ? group.skills.filter((skill) => typeof skill === 'string')
      : [],
    placement: group.placement ?? 'main',
  }));
}

function parseListSections(value: unknown, fallback: ListSection[]): ListSection[] {
  if (!Array.isArray(value)) return fallback;
  return (value as ListSection[]).map((section, index) => ({
    id: section.id ?? createId(`list-${index}`),
    title: section.title ?? '',
    items: Array.isArray(section.items)
      ? section.items.filter((item) => typeof item === 'string')
      : [],
    placement: section.placement ?? 'sidebar',
  }));
}

function parseCertifications(value: unknown, fallback: CertificationEntry[]): CertificationEntry[] {
  if (!Array.isArray(value)) return fallback;
  return (value as CertificationEntry[]).map((certificate, index) => ({
    id: certificate.id ?? createId(`cert-${index}`),
    name: certificate.name ?? '',
    organization: certificate.organization ?? '',
    date: certificate.date ?? '',
  }));
}

const defaultTemplateId = 'aria-stark';

export function ResumeDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const [drafts, setDrafts] = useState<ResumeDraft[]>([]);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [form, setForm] = useState<DraftFormState>(() => {
    const definition = getResumeTemplateDefinition(defaultTemplateId);
    return {
      ...deepClone(definition?.defaultContent ?? resumeTemplateDefinitions['aria-stark'].defaultContent),
      templateId: definition?.id ?? defaultTemplateId,
    };
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [activeKind, setActiveKind] = useState<'resume' | 'cv'>('resume');

  const entitlements = profile?.entitlements;

  useEffect(() => {
    if (!user) return;

    const loadTemplates = async () => {
      try {
        const templateCollection = collection(db, 'templates');
        const snapshot = await getDocs(templateCollection);

        if (snapshot.empty) {
          await Promise.all(
            resumeTemplateMetadata.map((template) =>
              setDoc(doc(db, 'templates', template.id), {
                name: template.name,
                description: template.description,
                kind: template.kind,
                accentColor: template.accentColor,
                createdAt: serverTimestamp(),
              })
            )
          );
        } else {
          await Promise.all(
            resumeTemplateMetadata.map((template) =>
              setDoc(doc(db, 'templates', template.id), {
                name: template.name,
                description: template.description,
                kind: template.kind,
                accentColor: template.accentColor,
                updatedAt: serverTimestamp(),
              }, { merge: true })
            )
          );
        }

        const orderedTemplates = query(collection(db, 'templates'), orderBy('name', 'asc'));
        const orderedSnapshot = await getDocs(orderedTemplates);
        setTemplates(
          orderedSnapshot.docs.map((document) => ({
            id: document.id,
            name: (document.data().name as string) ?? document.id,
            kind: (document.data().kind as ResumeTemplate['kind']) ?? 'resume',
            description: (document.data().description as string) ?? '',
            accentColor: (document.data().accentColor as string) ?? '#0f172a',
          }))
        );
      } catch (error) {
        console.error(error);
        setStatus('Unable to load templates from Firestore.');
      }
    };

    loadTemplates();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const draftsQuery = query(
      collection(db, 'drafts'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(draftsQuery, (snapshot) => {
      const parsed: ResumeDraft[] = snapshot.docs
        .map((document) => {
          const data = document.data();
          const templateId = (data.templateId as string) ?? '';
          const definition = getResumeTemplateDefinition(templateId);
          if (!definition) {
            return undefined;
          }

          return {
            id: document.id,
            ownerId: (data.ownerId as string) ?? user.uid,
            templateId,
            documentTitle: (data.documentTitle as string) ?? definition.defaultContent.documentTitle,
            profile: (data.profile as ResumeDraftContent['profile']) ?? definition.defaultContent.profile,
            summary: (data.summary as string | undefined) ?? definition.defaultContent.summary,
            objective: (data.objective as string | undefined) ?? definition.defaultContent.objective,
            workExperiences: parseExperiences(data.workExperiences, definition.defaultContent.workExperiences),
            education: parseEducation(data.education, definition.defaultContent.education),
            skillGroups: parseSkillGroups(data.skillGroups, definition.defaultContent.skillGroups),
            listSections: parseListSections(data.listSections, definition.defaultContent.listSections),
            certifications: parseCertifications(data.certifications, definition.defaultContent.certifications),
            updatedAt: (data.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
            createdAt: (data.createdAt as Timestamp)?.toDate?.(),
          } satisfies ResumeDraft;
        })
        .filter(Boolean) as ResumeDraft[];

      setDrafts(parsed);
      setLoadingDrafts(false);
    });

    return () => unsubscribe();
  }, [user]);

  const selectedTemplateDefinition = useMemo(
    () => getResumeTemplateDefinition(form.templateId) ?? resumeTemplateDefinitions[defaultTemplateId],
    [form.templateId]
  );

  const resumeDrafts = drafts.filter((draft) => getResumeTemplateDefinition(draft.templateId)?.kind === 'resume');

  const hydrateFromTemplate = (templateId: string) => {
    const definition = getResumeTemplateDefinition(templateId);
    if (!definition) return;

    setForm({
      ...deepClone(definition.defaultContent),
      templateId: definition.id,
      id: undefined,
    });
    setStatus(`Loaded the ${definition.name} template.`);
  };

  const hydrateFromDraft = async (draftId: string) => {
    try {
      const ref = doc(db, 'drafts', draftId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        setStatus('Draft not found.');
        return;
      }

      const data = snapshot.data();
      const templateId = (data.templateId as string) ?? defaultTemplateId;
      const definition = getResumeTemplateDefinition(templateId) ?? resumeTemplateDefinitions[defaultTemplateId];

      setForm({
        templateId,
        id: draftId,
        documentTitle: (data.documentTitle as string) ?? definition.defaultContent.documentTitle,
        profile: (data.profile as ResumeDraftContent['profile']) ?? definition.defaultContent.profile,
        summary: (data.summary as string | undefined) ?? definition.defaultContent.summary,
        objective: (data.objective as string | undefined) ?? definition.defaultContent.objective,
        workExperiences: parseExperiences(data.workExperiences, definition.defaultContent.workExperiences),
        education: parseEducation(data.education, definition.defaultContent.education),
        skillGroups: parseSkillGroups(data.skillGroups, definition.defaultContent.skillGroups),
        listSections: parseListSections(data.listSections, definition.defaultContent.listSections),
        certifications: parseCertifications(data.certifications, definition.defaultContent.certifications),
      });
      setStatus('Draft loaded into the editor.');
    } catch (error) {
      console.error(error);
      setStatus('Unable to load draft.');
    }
  };

  const updateExperienceField = (index: number, field: keyof ExperienceEntry, value: string | string[]) => {
    setForm((previous) => {
      const next = deepClone(previous.workExperiences);
      next[index] = { ...next[index], [field]: value } as ExperienceEntry;
      return { ...previous, workExperiences: next };
    });
  };

  const updateEducationField = (index: number, field: keyof EducationEntry, value: string | string[]) => {
    setForm((previous) => {
      const next = deepClone(previous.education);
      next[index] = { ...next[index], [field]: value } as EducationEntry;
      return { ...previous, education: next };
    });
  };

  const updateSkillGroup = (index: number, updates: Partial<SkillGroup>) => {
    setForm((previous) => {
      const next = deepClone(previous.skillGroups);
      next[index] = { ...next[index], ...updates };
      return { ...previous, skillGroups: next };
    });
  };

  const updateListSection = (index: number, updates: Partial<ListSection>) => {
    setForm((previous) => {
      const next = deepClone(previous.listSections);
      next[index] = { ...next[index], ...updates };
      return { ...previous, listSections: next };
    });
  };

  const updateCertification = (index: number, updates: Partial<CertificationEntry>) => {
    setForm((previous) => {
      const next = deepClone(previous.certifications);
      next[index] = { ...next[index], ...updates };
      return { ...previous, certifications: next };
    });
  };

  const saveDraft = async () => {
    if (!user) return;
    if (!form.documentTitle.trim()) {
      setStatus('Please provide a document title.');
      return;
    }

    try {
      const payload = {
        ownerId: user.uid,
        templateId: form.templateId,
        documentTitle: form.documentTitle,
        profile: form.profile,
        summary: form.summary ?? '',
        objective: form.objective ?? '',
        workExperiences: form.workExperiences,
        education: form.education,
        skillGroups: form.skillGroups,
        listSections: form.listSections,
        certifications: form.certifications,
        kind: 'resume',
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
      const { id: _id, templateId: _templateId, ...content } = form;
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: form.templateId,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${form.documentTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`;
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

  const resetForm = () => {
    const definition = getResumeTemplateDefinition(form.templateId);
    if (!definition) return;

    setForm({
      ...deepClone(definition.defaultContent),
      templateId: definition.id,
      id: undefined,
    });
    setStatus('Editor reset to template defaults.');
  };

  const addExperience = () => setForm((previous) => ({ ...previous, workExperiences: [...previous.workExperiences, emptyExperience()] }));
  const removeExperience = (index: number) =>
    setForm((previous) => ({
      ...previous,
      workExperiences: previous.workExperiences.filter((_, experienceIndex) => experienceIndex !== index),
    }));

  const addEducation = () => setForm((previous) => ({ ...previous, education: [...previous.education, emptyEducation()] }));
  const removeEducation = (index: number) =>
    setForm((previous) => ({ ...previous, education: previous.education.filter((_, educationIndex) => educationIndex !== index) }));

  const addSkillGroup = () => setForm((previous) => ({ ...previous, skillGroups: [...previous.skillGroups, emptySkillGroup()] }));
  const removeSkillGroup = (index: number) =>
    setForm((previous) => ({ ...previous, skillGroups: previous.skillGroups.filter((_, skillIndex) => skillIndex !== index) }));

  const addListSection = () => setForm((previous) => ({ ...previous, listSections: [...previous.listSections, emptyListSection()] }));
  const removeListSection = (index: number) =>
    setForm((previous) => ({ ...previous, listSections: previous.listSections.filter((_, listIndex) => listIndex !== index) }));

  const addCertification = () =>
    setForm((previous) => ({ ...previous, certifications: [...previous.certifications, emptyCertification()] }));
  const removeCertification = (index: number) =>
    setForm((previous) => ({
      ...previous,
      certifications: previous.certifications.filter((_, certificationIndex) => certificationIndex !== index),
    }));

  return (
    <section style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Documents</h1>
            <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
              Craft resumes and CVs with production-ready templates. Select a template to start editing and export polished PDFs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            {(['resume', 'cv'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setActiveKind(kind)}
                style={{
                  padding: '0.65rem 1.1rem',
                  borderRadius: '9999px',
                  border: kind === activeKind ? '1px solid #1d4ed8' : '1px solid #cbd5f5',
                  background: kind === activeKind ? '#1d4ed8' : '#fff',
                  color: kind === activeKind ? '#fff' : '#1d4ed8',
                  fontWeight: 600,
                }}
              >
                {kind === 'resume' ? 'Resume builder' : 'CV (coming soon)'}
              </button>
            ))}
          </div>
        </div>
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
        {status && <p style={{ marginTop: '1rem', color: '#2563eb' }}>{status}</p>}
      </div>

      {activeKind === 'resume' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <aside style={{ display: 'grid', gap: '1.5rem' }}>
            <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Templates</h2>
              <p style={{ marginTop: '0.25rem', color: '#64748b' }}>Pick a resume layout to preload the editor with matching sections.</p>
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                {templates
                  .filter((template) => template.kind === 'resume')
                  .map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => hydrateFromTemplate(template.id)}
                      style={{
                        display: 'grid',
                        gap: '0.35rem',
                        padding: '0.9rem 1rem',
                        borderRadius: '0.9rem',
                        border: template.id === form.templateId ? `2px solid ${template.accentColor}` : '1px solid #cbd5f5',
                        background: '#fff',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{template.name}</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{template.description}</span>
                    </button>
                  ))}
              </div>
            </section>

            <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Saved drafts</h2>
              {loadingDrafts ? (
                <p style={{ color: '#64748b' }}>Loading your drafts…</p>
              ) : resumeDrafts.length === 0 ? (
                <p style={{ color: '#64748b' }}>No drafts yet. Save a resume to see it here.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                  {resumeDrafts.map((draft) => (
                    <li key={draft.id}>
                      <button
                        type="button"
                        onClick={() => hydrateFromDraft(draft.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          border: '1px solid #cbd5f5',
                          background: '#f8fafc',
                          padding: '0.85rem 1rem',
                          borderRadius: '0.85rem',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{draft.documentTitle}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {getResumeTemplateDefinition(draft.templateId)?.name ?? 'Custom'} ·{' '}
                          {draft.updatedAt.toLocaleDateString()}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          <main style={{ display: 'grid', gap: '1.5rem' }}>
            <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <h2 style={{ marginTop: 0 }}>Resume editor</h2>
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Document title</span>
                  <input
                    type="text"
                    value={form.documentTitle}
                    onChange={(event) => setForm((previous) => ({ ...previous, documentTitle: event.target.value }))}
                    style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                    placeholder="e.g. Technical Writer Resume"
                  />
                </label>

                <div style={{ display: 'grid', gap: '0.75rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.9rem' }}>
                  <strong>Profile</strong>
                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                      <span>Full name</span>
                      <input
                        type="text"
                        value={form.profile.fullName}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            profile: { ...previous.profile, fullName: event.target.value },
                          }))
                        }
                        style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                      <span>Role</span>
                      <input
                        type="text"
                        value={form.profile.role}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            profile: { ...previous.profile, role: event.target.value },
                          }))
                        }
                        style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                      <span>Location</span>
                      <input
                        type="text"
                        value={form.profile.contact.location ?? ''}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            profile: {
                              ...previous.profile,
                              contact: { ...previous.profile.contact, location: event.target.value },
                            },
                          }))
                        }
                        style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                      <span>Email</span>
                      <input
                        type="email"
                        value={form.profile.contact.email ?? ''}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            profile: {
                              ...previous.profile,
                              contact: { ...previous.profile.contact, email: event.target.value },
                            },
                          }))
                        }
                        style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                      <span>Phone</span>
                      <input
                        type="tel"
                        value={form.profile.contact.phone ?? ''}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            profile: {
                              ...previous.profile,
                              contact: { ...previous.profile.contact, phone: event.target.value },
                            },
                          }))
                        }
                        style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                      <span>Website</span>
                      <input
                        type="text"
                        value={form.profile.contact.website ?? ''}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            profile: {
                              ...previous.profile,
                              contact: { ...previous.profile.contact, website: event.target.value },
                            },
                          }))
                        }
                        style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                      <span>LinkedIn</span>
                      <input
                        type="text"
                        value={form.profile.contact.linkedin ?? ''}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            profile: {
                              ...previous.profile,
                              contact: { ...previous.profile.contact, linkedin: event.target.value },
                            },
                          }))
                        }
                        style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                      />
                    </label>
                  </div>
                </div>

                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Summary</span>
                  <textarea
                    value={form.summary ?? ''}
                    onChange={(event) => setForm((previous) => ({ ...previous, summary: event.target.value }))}
                    rows={4}
                    style={{ padding: '0.75rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5', resize: 'vertical' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Career objective (optional)</span>
                  <textarea
                    value={form.objective ?? ''}
                    onChange={(event) => setForm((previous) => ({ ...previous, objective: event.target.value }))}
                    rows={3}
                    style={{ padding: '0.75rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5', resize: 'vertical' }}
                  />
                </label>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Work experience</strong>
                    <button type="button" onClick={addExperience} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #1d4ed8', background: '#e0f2fe', color: '#0f172a', fontWeight: 600 }}>
                      Add role
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {form.workExperiences.map((experience, index) => (
                      <div key={experience.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>Title</span>
                            <input
                              type="text"
                              value={experience.title}
                              onChange={(event) => updateExperienceField(index, 'title', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>Company</span>
                            <input
                              type="text"
                              value={experience.company}
                              onChange={(event) => updateExperienceField(index, 'company', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>Location</span>
                            <input
                              type="text"
                              value={experience.location ?? ''}
                              onChange={(event) => updateExperienceField(index, 'location', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>Category</span>
                            <input
                              type="text"
                              value={experience.category ?? ''}
                              onChange={(event) => updateExperienceField(index, 'category', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                              placeholder="e.g. Work Experience"
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>Start date</span>
                            <input
                              type="text"
                              value={experience.startDate}
                              onChange={(event) => updateExperienceField(index, 'startDate', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>End date</span>
                            <input
                              type="text"
                              value={experience.endDate}
                              onChange={(event) => updateExperienceField(index, 'endDate', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                        </div>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Bullets (one per line)</span>
                          <textarea
                            value={experience.bullets.join('\n')}
                            onChange={(event) => updateExperienceField(index, 'bullets', event.target.value.split('\n').filter((line) => line.trim().length > 0))}
                            rows={4}
                            style={{ padding: '0.75rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5', resize: 'vertical' }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          style={{ alignSelf: 'flex-end', padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #ef4444', background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}
                        >
                          Remove role
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Education</strong>
                    <button type="button" onClick={addEducation} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #1d4ed8', background: '#e0f2fe', color: '#0f172a', fontWeight: 600 }}>
                      Add school
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {form.education.map((entry, index) => (
                      <div key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>School</span>
                            <input
                              type="text"
                              value={entry.school}
                              onChange={(event) => updateEducationField(index, 'school', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>Degree</span>
                            <input
                              type="text"
                              value={entry.degree}
                              onChange={(event) => updateEducationField(index, 'degree', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>Location</span>
                            <input
                              type="text"
                              value={entry.location ?? ''}
                              onChange={(event) => updateEducationField(index, 'location', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>Start date</span>
                            <input
                              type="text"
                              value={entry.startDate ?? ''}
                              onChange={(event) => updateEducationField(index, 'startDate', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                          <label style={{ display: 'grid', gap: '0.35rem' }}>
                            <span>End date</span>
                            <input
                              type="text"
                              value={entry.endDate ?? ''}
                              onChange={(event) => updateEducationField(index, 'endDate', event.target.value)}
                              style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          style={{ alignSelf: 'flex-end', padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #ef4444', background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}
                        >
                          Remove education
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Skill groups</strong>
                    <button type="button" onClick={addSkillGroup} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #1d4ed8', background: '#e0f2fe', color: '#0f172a', fontWeight: 600 }}>
                      Add group
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {form.skillGroups.map((group, index) => (
                      <div key={group.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Title</span>
                          <input
                            type="text"
                            value={group.title}
                            onChange={(event) => updateSkillGroup(index, { title: event.target.value })}
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Skills (comma separated)</span>
                          <input
                            type="text"
                            value={group.skills.join(', ')}
                            onChange={(event) =>
                              updateSkillGroup(index, {
                                skills: event.target.value
                                  .split(',')
                                  .map((skill) => skill.trim())
                                  .filter(Boolean),
                              })
                            }
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Placement</span>
                          <select
                            value={group.placement ?? 'main'}
                            onChange={(event) => updateSkillGroup(index, { placement: event.target.value as SkillGroup['placement'] })}
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          >
                            <option value="main">Main content</option>
                            <option value="sidebar">Sidebar</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSkillGroup(index)}
                          style={{ alignSelf: 'flex-end', padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #ef4444', background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}
                        >
                          Remove group
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>List sections</strong>
                    <button type="button" onClick={addListSection} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #1d4ed8', background: '#e0f2fe', color: '#0f172a', fontWeight: 600 }}>
                      Add section
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {form.listSections.map((section, index) => (
                      <div key={section.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Title</span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(event) => updateListSection(index, { title: event.target.value })}
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Items (comma separated)</span>
                          <input
                            type="text"
                            value={section.items.join(', ')}
                            onChange={(event) =>
                              updateListSection(index, {
                                items: event.target.value
                                  .split(',')
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              })
                            }
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Placement</span>
                          <select
                            value={section.placement ?? 'sidebar'}
                            onChange={(event) => updateListSection(index, { placement: event.target.value as ListSection['placement'] })}
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          >
                            <option value="main">Main content</option>
                            <option value="sidebar">Sidebar</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeListSection(index)}
                          style={{ alignSelf: 'flex-end', padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #ef4444', background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}
                        >
                          Remove section
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Certifications</strong>
                    <button type="button" onClick={addCertification} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #1d4ed8', background: '#e0f2fe', color: '#0f172a', fontWeight: 600 }}>
                      Add certification
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {form.certifications.map((certificate, index) => (
                      <div key={certificate.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Name</span>
                          <input
                            type="text"
                            value={certificate.name}
                            onChange={(event) => updateCertification(index, { name: event.target.value })}
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Organization</span>
                          <input
                            type="text"
                            value={certificate.organization ?? ''}
                            onChange={(event) => updateCertification(index, { organization: event.target.value })}
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.35rem' }}>
                          <span>Date</span>
                          <input
                            type="text"
                            value={certificate.date ?? ''}
                            onChange={(event) => updateCertification(index, { date: event.target.value })}
                            style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          style={{ alignSelf: 'flex-end', padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #ef4444', background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}
                        >
                          Remove certification
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={saveDraft}
                    style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600 }}
                  >
                    Save draft
                  </button>
                  <button
                    onClick={generatePdf}
                    style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #0f172a', background: '#fff', color: '#0f172a', fontWeight: 600 }}
                  >
                    Generate PDF
                  </button>
                  <button
                    onClick={resetForm}
                    style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: '#e2e8f0', color: '#0f172a', fontWeight: 600 }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </section>

            <section style={{ background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Live preview</h2>
                <span style={{ color: '#64748b' }}>{selectedTemplateDefinition.name}</span>
              </div>
              <div style={{ overflowX: 'auto', padding: '1rem', background: '#e2e8f0', borderRadius: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {selectedTemplateDefinition.renderPreview(form)}
                </div>
              </div>
            </section>
          </main>
        </div>
      ) : (
        <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>Curriculum Vitae builder</h2>
          <p style={{ marginTop: '0.75rem', color: '#64748b' }}>
            CV layouts are coming soon. In the meantime, continue refining your resumes with the templates above.
          </p>
        </section>
      )}
    </section>
  );
}
