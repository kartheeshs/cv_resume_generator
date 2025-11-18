'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cloneElement, isValidElement, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
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
import { formatMessage, useLocalization } from '@/context/LocalizationContext';
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
import {
  ResumeTemplateDefinition,
  getResumeTemplateDefinition,
  resumeTemplateDefinitions,
  resumeTemplateMetadata,
} from '@/templates/resume/definitions';

interface DraftFormState extends ResumeDraftContent {
  id?: string;
  templateId: string;
}

interface DownloadLog {
  id: string;
  documentTitle: string;
  templateId: string;
  language?: string;
  plan?: string;
  createdAt?: Date;
}

type DashboardStatusTone = 'info' | 'success' | 'warning' | 'error';

interface DashboardStatus {
  id: number;
  message: string;
  tone: DashboardStatusTone;
}

function deepClone<T>(value: T): T {
  const clone = (globalThis as typeof globalThis & { structuredClone?: <U>(input: U) => U }).structuredClone;
  if (typeof clone === 'function') {
    return clone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function renderTemplateThumbnail(definition: ResumeTemplateDefinition) {
  const preview = definition.renderPreview(definition.defaultContent);
  if (isValidElement(preview)) {
    return cloneElement(preview, {
      style: {
        ...(preview.props.style ?? {}),
        margin: 0,
        width: '100%',
        maxWidth: '100%',
        height: '100%',
      },
    });
  }
  return preview;
}

let stripePromise: Promise<Stripe | null> | null = null;

function getStripeClient() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const DASHBOARD_AD_SLOT_STYLE: CSSProperties = {
  border: '2px dashed rgba(148, 163, 184, 0.45)',
  borderRadius: '1rem',
  padding: '1.25rem',
  background: '#f8fafc',
  display: 'grid',
  gap: '0.55rem',
};

const DASHBOARD_AD_LABEL_STYLE: CSSProperties = {
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: '#1d4ed8',
};

const DASHBOARD_AD_TEXT_STYLE: CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.5,
  fontSize: '0.95rem',
};

const DASHBOARD_AD_NOTE_STYLE: CSSProperties = {
  color: '#334155',
  fontSize: '0.8rem',
  fontWeight: 600,
};

const STATUS_TONE_STYLES: Record<DashboardStatusTone, { background: string; border: string; color: string; accent: string }> = {
  info: {
    background: 'rgba(37, 99, 235, 0.08)',
    border: 'rgba(37, 99, 235, 0.25)',
    color: '#1d4ed8',
    accent: '#2563eb',
  },
  success: {
    background: 'rgba(22, 163, 74, 0.12)',
    border: 'rgba(22, 163, 74, 0.3)',
    color: '#15803d',
    accent: '#22c55e',
  },
  warning: {
    background: 'rgba(217, 119, 6, 0.14)',
    border: 'rgba(217, 119, 6, 0.32)',
    color: '#b45309',
    accent: '#f97316',
  },
  error: {
    background: 'rgba(220, 38, 38, 0.14)',
    border: 'rgba(220, 38, 38, 0.32)',
    color: '#b91c1c',
    accent: '#ef4444',
  },
};

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
const TEMPLATE_THUMBNAIL_WIDTH = 864;
const TEMPLATE_THUMBNAIL_HEIGHT = 1120;
const TEMPLATE_THUMBNAIL_SCALE = 0.23;
type DashboardSection = 'resume' | 'cv' | 'drafts' | 'downloads' | 'settings';


const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese (Simplified)' },
] as const;

function formatLanguageLabel(value?: string) {
  const match = LANGUAGE_OPTIONS.find((option) => option.value === value);
  if (match) {
    return match.label;
  }
  if (value && value.trim().length > 0) {
    return value;
  }
  return 'English';
}

function deriveDocumentTitle(
  content: Pick<ResumeDraftContent, 'documentTitle' | 'profile'>,
  definition: ResumeTemplateDefinition
) {
  const stored = content.documentTitle?.trim();
  if (stored) {
    return stored;
  }

  const fullName = content.profile.fullName?.trim();
  if (fullName) {
    const suffix = definition.kind === 'cv' ? 'CV' : 'Resume';
    return `${fullName} ${suffix}`;
  }

  const fallback = definition.defaultContent.documentTitle?.trim();
  if (fallback) {
    return fallback;
  }

  const descriptor = definition.kind === 'cv' ? 'CV' : 'Resume';
  return `${definition.name} ${descriptor}`;
}

function resolveLanguageValue(value: string | undefined, definition: ResumeTemplateDefinition) {
  const trimmed = value?.trim();
  if (trimmed) {
    return trimmed;
  }
  return definition.defaultContent.language ?? 'en';
}

export function ResumeDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const { copy } = useLocalization();
  const dashboardCopy = copy.resumeDashboard;
  const statuses = dashboardCopy.statuses;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drafts, setDrafts] = useState<ResumeDraft[]>([]);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [form, setForm] = useState<DraftFormState>(() => {
    const definition = getResumeTemplateDefinition(defaultTemplateId);
    const effectiveDefinition = definition ?? resumeTemplateDefinitions['aria-stark'];
    const defaultContent = deepClone(effectiveDefinition.defaultContent);
    return {
      ...defaultContent,
      documentTitle: '',
      language: resolveLanguageValue(defaultContent.language, effectiveDefinition),
      templateId: effectiveDefinition.id,
      id: undefined,
    };
  });
  const [status, setStatusState] = useState<DashboardStatus | null>(null);

  const showStatus = useCallback(
    (message: string, tone: DashboardStatusTone = 'info') => {
      setStatusState({
        id: Date.now(),
        message,
        tone,
      });
    },
    []
  );

  useEffect(() => {
    if (!status) {
      return;
    }

    const timeout = setTimeout(() => {
      setStatusState(null);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [status]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [activeSection, setActiveSection] = useState<DashboardSection>('resume');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [syncingSubscription, setSyncingSubscription] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [processedSessionId, setProcessedSessionId] = useState<string | null>(null);

  const entitlements = profile?.entitlements;
  const isProPlan = entitlements?.plan === 'pro';
  const remainingDownloads = entitlements?.remainingDownloads ?? null;
  const downloadsDepleted =
    Boolean(entitlements) && !isProPlan && (remainingDownloads ?? 0) <= 0;
  const nextRefreshAt = entitlements?.nextRefreshAt ?? null;
  const nextRefreshDisplay = nextRefreshAt ? nextRefreshAt.toLocaleString() : '—';
  const downloadsDisplay = isProPlan
    ? dashboardCopy.unlimitedDownloads
    : String(remainingDownloads ?? 0);
  const navMenu = dashboardCopy.sectionLabels as { id: DashboardSection; label: string; description: string }[];
  const activeMenu = navMenu.find((item) => item.id === activeSection);
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
        showStatus(statuses.loadTemplatesError, 'error');
      }
    };

    loadTemplates();
  }, [showStatus, statuses.loadTemplatesError, user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const sessionId = searchParams?.get('session_id');
    if (!sessionId || processedSessionId === sessionId || syncingSubscription) {
      return;
    }

    const syncSubscription = async () => {
      setSyncingSubscription(true);
      try {
        const response = await fetch(`/api/billing/session?session_id=${encodeURIComponent(sessionId)}`);
        const payload = (await response.json().catch(() => null)) as
          | {
              status?: string;
              subscriptionId?: string | null;
              subscriptionStatus?: string | null;
              customerId?: string | null;
              currentPeriodEnd?: string | null;
            }
          | null;

        if (!response.ok || !payload) {
          console.error('Failed to load checkout session details', payload);
          showStatus(statuses.subscriptionRefreshFailed, 'error');
          return;
        }

        if (payload.status !== 'complete') {
          showStatus(statuses.checkoutCancelled, 'warning');
          return;
        }

        const updates: Record<string, unknown> = {
          'entitlements.plan': 'pro',
          'entitlements.remainingDownloads': null,
          'entitlements.nextRefreshAt': null,
          'subscription.id': payload.subscriptionId ?? null,
          'subscription.status': payload.subscriptionStatus ?? 'active',
          'subscription.lastSyncedAt': serverTimestamp(),
        };

        if (payload.currentPeriodEnd) {
          updates['subscription.currentPeriodEnd'] = Timestamp.fromDate(
            new Date(payload.currentPeriodEnd)
          );
        } else {
          updates['subscription.currentPeriodEnd'] = null;
        }

        if (payload.customerId) {
          updates['stripeCustomerId'] = payload.customerId;
        }

        await updateDoc(doc(db, 'users', user.uid), updates);
        await refreshProfile();
        showStatus(statuses.subscriptionUpgraded, 'success');
      } catch (error) {
        console.error('Failed to sync subscription', error);
        showStatus(statuses.subscriptionRefreshFailed, 'error');
      } finally {
        setProcessedSessionId(sessionId);
        setSyncingSubscription(false);
        router.replace('/dashboard', { scroll: false });
      }
    };

    syncSubscription();
  }, [
    processedSessionId,
    refreshProfile,
    router,
    showStatus,
    searchParams,
    statuses.checkoutCancelled,
    statuses.subscriptionRefreshFailed,
    statuses.subscriptionUpgraded,
    user,
    syncingSubscription,
  ]);

  useEffect(() => {
    if (!user) {
      setDrafts([]);
      setLoadingDrafts(false);
      return;
    }
    setLoadingDrafts(true);

    const draftsQuery = query(collection(db, 'drafts'), where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(
      draftsQuery,
      (snapshot) => {
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
              language: (data.language as string | undefined) ?? definition.defaultContent.language ?? 'en',
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
          .filter(Boolean)
          .sort((a, b) => {
            const first = (a?.updatedAt ?? new Date(0)).getTime();
            const second = (b?.updatedAt ?? new Date(0)).getTime();
            return second - first;
          }) as ResumeDraft[];

        setDrafts(parsed);
        setLoadingDrafts(false);
      },
      (error) => {
        console.error('Failed to load drafts', error);
        showStatus(statuses.loadDraftsError, 'error');
        setLoadingDrafts(false);
      }
    );

    return () => unsubscribe();
  }, [showStatus, statuses.loadDraftsError, user]);

  useEffect(() => {
    if (!user) {
      setDownloads([]);
      setLoadingDownloads(false);
      return;
    }

    const downloadsQuery = query(collection(db, 'downloads'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      downloadsQuery,
      (snapshot) => {
        const rows: DownloadLog[] = snapshot.docs
          .map((document) => {
            const data = document.data();
            return {
              id: document.id,
              documentTitle: (data.documentTitle as string) ?? 'Untitled resume',
              templateId: (data.templateId as string) ?? 'unknown-template',
              language: data.language as string | undefined,
              plan: data.plan as string | undefined,
              createdAt: (data.createdAt as Timestamp | undefined)?.toDate?.(),
            };
          })
          .sort((a, b) => {
            const first = (a.createdAt ?? new Date(0)).getTime();
            const second = (b.createdAt ?? new Date(0)).getTime();
            return second - first;
          })
          .slice(0, 25);
        setDownloads(rows);
        setLoadingDownloads(false);
      },
      (error) => {
        console.error('Failed to load downloads', error);
        showStatus(statuses.loadDownloadsError, 'error');
        setLoadingDownloads(false);
      }
    );

    return () => unsubscribe();
  }, [showStatus, statuses.loadDownloadsError, user]);

  const selectedTemplateDefinition = useMemo(
    () => getResumeTemplateDefinition(form.templateId) ?? resumeTemplateDefinitions[defaultTemplateId],
    [form.templateId]
  );

  const resolvedLanguage = useMemo(
    () => resolveLanguageValue(form.language, selectedTemplateDefinition),
    [form.language, selectedTemplateDefinition]
  );

  const computedDocumentTitle = useMemo(
    () => deriveDocumentTitle(form, selectedTemplateDefinition),
    [form.documentTitle, form.profile.fullName, selectedTemplateDefinition]
  );

  const resumeTemplates = useMemo(
    () =>
      templates
        .filter((template) => template.kind === 'resume')
        .map((template) => ({
          template,
          definition: getResumeTemplateDefinition(template.id),
        }))
        .filter(
          (
            entry,
          ): entry is {
            template: ResumeTemplate;
            definition: ResumeTemplateDefinition;
          } => Boolean(entry.definition)
        ),
    [templates]
  );

  const cvTemplates = useMemo(
    () =>
      templates
        .filter((template) => template.kind === 'cv')
        .map((template) => ({
          template,
          definition: getResumeTemplateDefinition(template.id),
        }))
        .filter(
          (
            entry,
          ): entry is {
            template: ResumeTemplate;
            definition: ResumeTemplateDefinition;
          } => Boolean(entry.definition)
        ),
    [templates]
  );

  const resumeDrafts = drafts.filter((draft) => getResumeTemplateDefinition(draft.templateId)?.kind === 'resume');
  const cvDrafts = drafts.filter((draft) => getResumeTemplateDefinition(draft.templateId)?.kind === 'cv');

  const syncSubscription = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) {
        showStatus(statuses.signInRequired, 'warning');
        return;
      }
      setSyncingSubscription(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await refreshProfile();
        if (!options?.silent) {
          showStatus(statuses.subscriptionRefreshed, 'success');
        }
      } catch (error) {
        console.error('Demo subscription sync failed', error);
        showStatus(statuses.subscriptionRefreshFailed, 'error');
      } finally {
        setSyncingSubscription(false);
      }
    },
    [
      refreshProfile,
      showStatus,
      statuses.signInRequired,
      statuses.subscriptionRefreshed,
      statuses.subscriptionRefreshFailed,
      user,
    ]
  );

  const openBillingPortal = useCallback(async () => {
    if (!user) {
      showStatus(statuses.billingSignInRequired, 'warning');
      return;
    }
    setOpeningPortal(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      showStatus(statuses.billingDisabled, 'info');
    } catch (error) {
      console.error('Demo billing portal error', error);
      showStatus(statuses.billingError, 'error');
    } finally {
      setOpeningPortal(false);
    }
  }, [
    showStatus,
    statuses.billingDisabled,
    statuses.billingError,
    statuses.billingSignInRequired,
    user,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const upgradeStatus = params.get('upgrade');
    if (!upgradeStatus) {
      return;
    }
    if (upgradeStatus === 'success') {
      syncSubscription({ silent: true }).then(() => {
        showStatus(statuses.subscriptionUpgraded, 'success');
      });
    } else if (upgradeStatus === 'cancelled') {
      showStatus(statuses.checkoutCancelled, 'warning');
    }
    params.delete('upgrade');
    const newQuery = params.toString();
    const nextUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [
    showStatus,
    statuses.checkoutCancelled,
    statuses.subscriptionUpgraded,
    syncSubscription,
    user,
  ]);

  const hydrateFromTemplate = (templateId: string) => {
    const definition = getResumeTemplateDefinition(templateId);
    if (!definition) return;

    const content = deepClone(definition.defaultContent);

    setForm({
      ...content,
      documentTitle: '',
      language: resolveLanguageValue(content.language, definition),
      templateId: definition.id,
      id: undefined,
    });
    setViewMode('edit');
    showStatus(`Loaded the ${definition.name} template.`, 'info');
    setActiveSection('resume');
  };

  const hydrateFromDraft = async (draftId: string) => {
    try {
      const ref = doc(db, 'drafts', draftId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        showStatus(statuses.draftNotFound, 'error');
        return;
      }

      const data = snapshot.data();
      const templateId = (data.templateId as string) ?? defaultTemplateId;
      const definition = getResumeTemplateDefinition(templateId) ?? resumeTemplateDefinitions[defaultTemplateId];
      const language = resolveLanguageValue(data.language as string | undefined, definition);

      setForm({
        templateId,
        id: draftId,
        language,
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
      setViewMode('edit');
      showStatus(statuses.draftLoaded, 'info');
      setActiveSection('resume');
    } catch (error) {
      console.error(error);
      showStatus(statuses.draftLoadFailed, 'error');
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

  const saveDraft = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const documentTitle = computedDocumentTitle;
      const language = resolvedLanguage;
      const payload = {
        ownerId: user.uid,
        templateId: form.templateId,
        documentTitle,
        language,
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
        setForm((previous) => ({ ...previous, documentTitle, language }));
        showStatus(statuses.draftUpdated, 'success');
        return form.id;
      }

      const ref = await addDoc(collection(db, 'drafts'), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      setForm((previous) => ({ ...previous, id: ref.id, documentTitle, language }));
      showStatus(statuses.draftCreated, 'success');
      return ref.id;
    } catch (error) {
      console.error(error);
      showStatus(statuses.draftSaveFailed, 'error');
      return null;
    }
  };

  const startCheckout = useCallback(async () => {
    if (!user) {
      showStatus(statuses.billingSignInRequired, 'warning');
      return;
    }
    if (!profile) {
      showStatus(statuses.missingEntitlements, 'error');
      return;
    }

    setStartingCheckout(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: profile.email ?? user.email ?? undefined,
          customerId: profile.stripeCustomerId ?? undefined,
        }),
      });

      if (response.status === 503) {
        showStatus(statuses.billingDisabled, 'info');
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { url?: string | null; sessionId?: string | null; message?: string }
        | null;

      if (!response.ok) {
        console.error('Failed to create checkout session', payload);
        showStatus(statuses.checkoutFailed, 'error');
        return;
      }

      const stripeClientPromise = payload?.sessionId ? getStripeClient() : null;
      if (payload?.sessionId && stripeClientPromise) {
        const stripeClient = await stripeClientPromise;
        if (stripeClient) {
          const { error } = await stripeClient.redirectToCheckout({ sessionId: payload.sessionId });
          if (!error) {
            return;
          }
          console.error('Stripe redirect failed', error);
        }
      }

      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      showStatus(statuses.checkoutFailed, 'error');
    } catch (error) {
      console.error('Failed to start checkout', error);
      showStatus(statuses.billingError, 'error');
    } finally {
      setStartingCheckout(false);
    }
  }, [
    profile,
    showStatus,
    statuses.billingDisabled,
    statuses.billingError,
    statuses.billingSignInRequired,
    statuses.checkoutFailed,
    statuses.missingEntitlements,
    user,
  ]);

  const generatePdf = async () => {
    if (!entitlements) {
      showStatus(statuses.missingEntitlements, 'error');
      return;
    }
    if (!isProPlan && (entitlements.remainingDownloads ?? 0) <= 0) {
      showStatus(statuses.downloadLimitReached, 'warning');
      return;
    }

    let draftId = form.id;
    if (!draftId) {
      const savedId = await saveDraft();
      if (!savedId) {
        return;
      }
      draftId = savedId;
    }

    try {
      const { id: _id, templateId: _templateId, ...rawContent } = form;
      const content: ResumeDraftContent = {
        ...rawContent,
        documentTitle: computedDocumentTitle,
        language: resolvedLanguage,
      };
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
      anchor.download = `${computedDocumentTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      if (user) {
        try {
          await addDoc(collection(db, 'downloads'), {
            userId: user.uid,
            draftId,
            templateId: form.templateId,
            documentTitle: computedDocumentTitle,
            language: resolvedLanguage,
            plan: entitlements.plan,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('Failed to record download event', error);
        }
      }

      if (user && !isProPlan) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            'entitlements.remainingDownloads': increment(-1),
          });
        } catch (error) {
          console.error('Failed to decrement download allowance', error);
        }
        await refreshProfile();
      }
      showStatus(statuses.pdfSuccess, 'success');
    } catch (error) {
      console.error(error);
      showStatus(statuses.pdfFailed, 'error');
    }
  };

  const resetForm = () => {
    const definition = getResumeTemplateDefinition(form.templateId);
    if (!definition) return;

    setForm({
      ...deepClone(definition.defaultContent),
      documentTitle: '',
      language: resolveLanguageValue(definition.defaultContent.language, definition),
      templateId: definition.id,
      id: undefined,
    });
    setViewMode('edit');
    showStatus(statuses.editorReset, 'info');
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

  const statusTone = status ? STATUS_TONE_STYLES[status.tone] : null;

  return (
    <>
      {status && statusTone ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            padding: '0.85rem 1.1rem',
            borderRadius: '0.9rem',
            background: statusTone.background,
            border: `1px solid ${statusTone.border}`,
            color: statusTone.color,
            boxShadow: '0 20px 45px -20px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            pointerEvents: 'none',
            zIndex: 60,
            minWidth: '240px',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={statusTone.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" strokeOpacity="0.45" />
            <path d="M12 3a9 9 0 0 1 9 9">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
          <span style={{ fontWeight: 600 }}>{status.message}</span>
        </div>
      ) : null}

      <section style={{ padding: '2rem 1.25rem', background: '#f8fafc', minHeight: '100%' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
          gap: '1.75rem',
        }}
      >
        <header
          style={{
            background: '#fff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 32px 90px -60px rgba(15, 23, 42, 0.35)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.5rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'grid', gap: '0.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{dashboardCopy.heroTitle}</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                {profile?.email ?? user?.email ?? dashboardCopy.signedInFallback}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {entitlements ? (
                <>
                  <div
                    style={{
                      background: '#f1f5f9',
                      borderRadius: '0.75rem',
                      padding: '0.65rem 0.95rem',
                      display: 'grid',
                      gap: '0.2rem',
                      minWidth: '140px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: '#64748b',
                      }}
                    >
                      {dashboardCopy.planLabel}
                    </span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{entitlements.plan.toUpperCase()}</span>
                  </div>
                  <div
                    style={{
                      background: isProPlan ? '#dcfce7' : downloadsDepleted ? '#fee2e2' : '#ecfeff',
                      borderRadius: '0.75rem',
                      padding: '0.65rem 0.95rem',
                      display: 'grid',
                      gap: '0.2rem',
                      minWidth: '180px',
                      border: downloadsDepleted && !isProPlan
                        ? '1px solid #fecaca'
                        : '1px solid rgba(14, 165, 233, 0.35)',
                      color: downloadsDepleted && !isProPlan ? '#b91c1c' : '#0f172a',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      {dashboardCopy.downloadsLeftLabel}
                    </span>
                    <span style={{ fontWeight: 700 }}>{downloadsDisplay}</span>
                  </div>
                  {isProPlan ? (
                    <div
                      style={{
                        background: '#ecfdf5',
                        borderRadius: '0.75rem',
                        padding: '0.75rem 1rem',
                        color: '#047857',
                        fontWeight: 600,
                        minWidth: '220px',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      {dashboardCopy.unlimitedDownloadsDescription}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startCheckout}
                      disabled={startingCheckout}
                      style={{
                        border: '1px solid rgba(37, 99, 235, 0.4)',
                        background: startingCheckout ? '#bfdbfe' : '#2563eb',
                        color: startingCheckout ? '#1e3a8a' : '#fff',
                        padding: '0.55rem 1.1rem',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        boxShadow: '0 12px 28px -18px rgba(37, 99, 235, 0.6)',
                        cursor: startingCheckout ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {startingCheckout
                        ? dashboardCopy.subscribeCtaLoading
                        : dashboardCopy.subscribeCta}
                    </button>
                  )}
                </>
              ) : (
                <div
                  style={{
                    background: '#f1f5f9',
                    borderRadius: '0.75rem',
                    padding: '0.65rem 0.95rem',
                    color: '#475569',
                    fontWeight: 600,
                  }}
                >
                  {dashboardCopy.loadingEntitlements}
                </div>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', padding: '0 1.75rem 1.25rem' }}>
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '1rem',
              }}
            >
              {navMenu.map((item) => {
                const isActive = item.id === activeSection;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '0.8rem 1rem',
                      fontWeight: 600,
                      color: isActive ? '#0f172a' : '#64748b',
                      borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                      borderRadius: '0.6rem 0.6rem 0 0',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
            {activeMenu && (
              <p style={{ margin: '0.85rem 0 0', color: '#475569', fontSize: '0.9rem' }}>{activeMenu.description}</p>
            )}
          </div>
        </header>
        <aside
          aria-label="Dashboard banner advertisement"
          role="complementary"
          style={{
            ...DASHBOARD_AD_SLOT_STYLE,
            border: '2px dashed rgba(59, 130, 246, 0.45)',
            background: 'rgba(191, 219, 254, 0.55)',
            boxShadow: '0 24px 65px -50px rgba(37, 99, 235, 0.35)',
          }}
        >
          <span style={DASHBOARD_AD_LABEL_STYLE}>Ad Space</span>
          <p style={DASHBOARD_AD_TEXT_STYLE}>
            Showcase a premium sponsor or partner integration to help members unlock more career opportunities.
          </p>
          <span style={{ ...DASHBOARD_AD_NOTE_STYLE, color: '#1d4ed8' }}>Ideal size: 970 × 90</span>
        </aside>
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          {activeSection === 'resume' && (
            <>
              <div
                style={{
                  background: '#fff',
                  borderRadius: '1rem',
                  border: '1px solid #e2e8f0',
                  padding: '1.75rem',
                  display: 'grid',
                  gap: '1.5rem',
                }}
              >
                <div>
                  <h1 style={{ margin: 0, fontSize: '2rem' }}>{dashboardCopy.resumeHeading}</h1>
                  <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{dashboardCopy.resumeCopy}</p>
                </div>
                {entitlements && (
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#eef2ff', minWidth: '200px' }}>
                      <strong>{dashboardCopy.planLabel}</strong>
                      <div style={{ fontSize: '1.2rem' }}>{entitlements.plan.toUpperCase()}</div>
                    </div>
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: isProPlan ? '#dcfce7' : downloadsDepleted ? '#fee2e2' : '#ecfeff',
                        minWidth: '200px',
                        color: downloadsDepleted && !isProPlan ? '#b91c1c' : '#0f172a',
                        border: downloadsDepleted && !isProPlan ? '1px solid #fecaca' : 'none',
                      }}
                    >
                      <strong>{dashboardCopy.downloadsLeftLabel}</strong>
                      <div style={{ fontSize: '1.2rem' }}>{downloadsDisplay}</div>
                    </div>
                    {isProPlan ? (
                      <div
                        style={{
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          background: '#ecfdf5',
                          minWidth: '240px',
                          color: '#047857',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          fontWeight: 600,
                        }}
                      >
                        {dashboardCopy.unlimitedDownloadsDescription}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          background: '#f8fafc',
                          minWidth: '240px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          display: 'grid',
                          gap: '0.4rem',
                        }}
                      >
                        <strong>{dashboardCopy.nextRefreshLabel}</strong>
                        <div style={{ fontSize: '1.05rem' }}>
                          {nextRefreshAt ? nextRefreshDisplay : dashboardCopy.freePlanRefreshInfo}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                          {dashboardCopy.downloadLimitNotice}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {downloadsDepleted && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      background: '#fef2f2',
                      color: '#b91c1c',
                      fontWeight: 600,
                      display: 'grid',
                      gap: '0.35rem',
                    }}
                  >
                    <span>{dashboardCopy.downloadLimitExceeded}</span>
                    <span style={{ fontWeight: 500 }}>{dashboardCopy.downloadResetByAdmin}</span>
                  </div>
                )}
              </div>

              <aside
                aria-label="Resume editor sidebar advertisement"
                role="complementary"
                style={{
                  ...DASHBOARD_AD_SLOT_STYLE,
                  border: '2px dashed rgba(251, 146, 60, 0.45)',
                  background: 'rgba(254, 243, 199, 0.6)',
                }}
              >
                <span style={{ ...DASHBOARD_AD_LABEL_STYLE, color: '#c2410c' }}>Ad Space</span>
                <p style={DASHBOARD_AD_TEXT_STYLE}>
                  Introduce interview coaching, portfolio audits, or premium resume review services alongside the editor.
                </p>
                <span style={{ ...DASHBOARD_AD_NOTE_STYLE, color: '#b45309' }}>Suggested size: 300 × 250</span>
              </aside>

              {viewMode === 'preview' ? (
          <div
            style={{
              background: '#fff',
              borderRadius: '1rem',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              display: 'grid',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Preview</h2>
                <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
                  Reviewing the {selectedTemplateDefinition.name} layout with your latest edits.
                </p>
                <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                  Language: {formatLanguageLabel(resolvedLanguage)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  style={{
                    padding: '0.75rem 1.35rem',
                    borderRadius: '0.85rem',
                    border: '1px solid #cbd5f5',
                    background: '#fff',
                    color: '#1d4ed8',
                    fontWeight: 600,
                  }}
                >
                  Return to editor
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  style={{
                    padding: '0.75rem 1.35rem',
                    borderRadius: '0.85rem',
                    border: '1px solid #0f172a',
                    background: '#fff',
                    color: '#0f172a',
                    fontWeight: 600,
                  }}
                >
                  {dashboardCopy.saveDraftAction}
                </button>
                <button
                  type="button"
                  onClick={generatePdf}
                  disabled={downloadsDepleted}
                  style={{
                    padding: '0.75rem 1.35rem',
                    borderRadius: '0.85rem',
                    border: '1px solid #0f172a',
                    background: downloadsDepleted ? '#e2e8f0' : '#0f172a',
                    color: downloadsDepleted ? '#64748b' : '#fff',
                    fontWeight: 600,
                    cursor: downloadsDepleted ? 'not-allowed' : 'pointer',
                  }}
                >
                  {dashboardCopy.downloadAction}
                </button>
              </div>
            </div>
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                overflowX: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0.5rem' }}>
                {selectedTemplateDefinition.renderPreview(form)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.75rem', alignItems: 'start' }}>
            <aside style={{ display: 'grid', gap: '1.5rem' }}>
            <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Templates</h2>
                <p style={{ margin: 0, color: '#64748b' }}>Preview layouts before loading them into your editor.</p>
              </div>
              <div
                style={{
                  display: 'grid',
                  gap: '1.1rem',
                  marginTop: '1.5rem',
                }}
              >
                {resumeTemplates.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>Templates are still loading…</p>
                ) : (
                  resumeTemplates.map(({ template, definition }) => {
                    const isActive = template.id === form.templateId;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => hydrateFromTemplate(template.id)}
                        style={{
                          display: 'grid',
                          gap: '0.85rem',
                          padding: '1rem',
                          borderRadius: '1rem',
                          border: `2px solid ${isActive ? template.accentColor : '#dbeafe'}`,
                          background: '#fff',
                          textAlign: 'left',
                          boxShadow: isActive
                            ? '0 18px 40px rgba(15, 23, 42, 0.18)'
                            : '0 12px 24px rgba(15, 23, 42, 0.05)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                      >
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              aspectRatio: '3 / 4',
                              borderRadius: '0.85rem',
                              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                inset: '12px',
                                borderRadius: '0.75rem',
                                background: '#fff',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: TEMPLATE_THUMBNAIL_WIDTH,
                                  height: TEMPLATE_THUMBNAIL_HEIGHT,
                                  transform: `scale(${TEMPLATE_THUMBNAIL_SCALE})`,
                                  transformOrigin: 'top left',
                                  pointerEvents: 'none',
                                }}
                              >
                                {renderTemplateThumbnail(definition)}
                              </div>
                            </div>
                          </div>
                        <div style={{ display: 'grid', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{template.name}</span>
                          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{template.description}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>{dashboardCopy.draftsHeading}</h2>
              {loadingDrafts ? (
                <p style={{ color: '#64748b' }}>{dashboardCopy.draftsLoading}</p>
              ) : resumeDrafts.length === 0 ? (
                <p style={{ color: '#64748b' }}>{dashboardCopy.draftsEmpty}</p>
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
                          {getResumeTemplateDefinition(draft.templateId)?.name ?? dashboardCopy.customTemplateFallback} ·{' '}
                          {draft.updatedAt.toLocaleDateString()} · {formatLanguageLabel(draft.language)}
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
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Document title</span>
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      fontWeight: 600,
                    }}
                  >
                    {computedDocumentTitle}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Updated automatically from your profile name and template.
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Language</span>
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                    }}
                  >
                    {formatLanguageLabel(resolvedLanguage)}
                  </div>
                </div>

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
                    type="button"
                    onClick={saveDraft}
                    style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #0f172a', background: '#fff', color: '#0f172a', fontWeight: 600 }}
                  >
                    {dashboardCopy.saveDraftAction}
                  </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  style={{
                    padding: '0.75rem 1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #1d4ed8',
                      background: '#1d4ed8',
                      color: '#fff',
                      fontWeight: 600,
                  }}
                >
                  {dashboardCopy.previewAction}
                </button>
                  <button
                    type="button"
                    onClick={generatePdf}
                    disabled={downloadsDepleted}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #0f172a',
                      background: downloadsDepleted ? '#e2e8f0' : '#0f172a',
                      color: downloadsDepleted ? '#64748b' : '#fff',
                      fontWeight: 600,
                      cursor: downloadsDepleted ? 'not-allowed' : 'pointer',
                    }}
                  >
                  {dashboardCopy.downloadAction}
                </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: '#e2e8f0', color: '#0f172a', fontWeight: 600 }}
                  >
                  {dashboardCopy.resetAction}
                </button>
                </div>
              </div>
            </section>
            </main>
          </div>
      )}
    </>
  )}
          {activeSection === 'cv' && (
            <section
              style={{
                background: '#fff',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                padding: '1.75rem',
                display: 'grid',
                gap: '1.75rem',
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Curriculum Vitae library</h1>
                <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>
                  Explore long-form CV layouts tailored for international applications and multi-page academic profiles.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                  {cvTemplates.length === 0 ? (
                    <div
                      style={{
                        border: '1px dashed #cbd5f5',
                        borderRadius: '0.85rem',
                        padding: '1.5rem',
                        color: '#64748b',
                        background: '#f8fafc',
                      }}
                    >
                      CV templates are syncing. Please wait a moment and they&apos;ll appear here automatically.
                    </div>
                  ) : (
                    cvTemplates.map(({ template, definition }) => {
                      const isActive = template.id === form.templateId;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => hydrateFromTemplate(template.id)}
                          style={{
                            display: 'grid',
                            gap: '0.9rem',
                            padding: '1.1rem',
                            borderRadius: '1rem',
                            border: `2px solid ${isActive ? template.accentColor : '#e2e8f0'}`,
                            background: '#fff',
                            textAlign: 'left',
                            boxShadow: isActive
                              ? '0 22px 44px rgba(37, 99, 235, 0.18)'
                              : '0 16px 30px rgba(15, 23, 42, 0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              aspectRatio: '3 / 4',
                              borderRadius: '0.85rem',
                              background: 'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 60%, #e2e8f0 100%)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                inset: '12px',
                                borderRadius: '0.75rem',
                                background: '#fff',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: TEMPLATE_THUMBNAIL_WIDTH,
                                  height: TEMPLATE_THUMBNAIL_HEIGHT,
                                  transform: `scale(${TEMPLATE_THUMBNAIL_SCALE})`,
                                  transformOrigin: 'top left',
                                  pointerEvents: 'none',
                                }}
                              >
                                {renderTemplateThumbnail(definition)}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: '0.35rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{template.name}</span>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{template.description}</span>
                          </div>
                          <span style={{ fontSize: '0.85rem', color: template.accentColor, fontWeight: 600 }}>
                            {dashboardCopy.openInEditor}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{dashboardCopy.cvDraftsHeading}</h2>
                {loadingDrafts ? (
                  <p style={{ color: '#64748b' }}>{dashboardCopy.draftsLoading}</p>
                ) : cvDrafts.length === 0 ? (
                  <p style={{ color: '#64748b' }}>{dashboardCopy.draftsEmpty}</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.85rem' }}>
                    {cvDrafts.map((draft) => {
                      const definition = getResumeTemplateDefinition(draft.templateId);
                      return (
                        <li key={draft.id}>
                          <div
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.9rem',
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '1rem',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700 }}>{draft.documentTitle}</div>
                              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                {definition?.name ?? dashboardCopy.customTemplateFallback} · Updated {draft.updatedAt.toLocaleDateString()} ·{' '}
                                {formatLanguageLabel(draft.language)}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  await hydrateFromDraft(draft.id);
                                  setActiveSection('resume');
                                  setViewMode('edit');
                                }}
                                style={{
                                  padding: '0.6rem 1.1rem',
                                  borderRadius: '0.75rem',
                                  border: '1px solid #0f172a',
                                  background: '#fff',
                                  color: '#0f172a',
                                  fontWeight: 600,
                                }}
                              >
                                {dashboardCopy.editAction}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await hydrateFromDraft(draft.id);
                                  setActiveSection('resume');
                                  setViewMode('preview');
                                }}
                                style={{
                                  padding: '0.6rem 1.1rem',
                                  borderRadius: '0.75rem',
                                  border: '1px solid #2563eb',
                                  background: '#2563eb',
                                  color: '#fff',
                                  fontWeight: 600,
                                }}
                              >
                                {dashboardCopy.previewAction}
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          )}
          {activeSection === 'drafts' && (
            <section
              style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'grid', gap: '1.5rem' }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{dashboardCopy.draftsHeading}</h1>
                <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{dashboardCopy.draftsDescription}</p>
              </div>
              {loadingDrafts ? (
                <p style={{ color: '#64748b' }}>{dashboardCopy.draftsLoading}</p>
              ) : drafts.length === 0 ? (
                <p style={{ color: '#64748b' }}>{dashboardCopy.draftsEmpty}</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                  {drafts.map((draft) => {
                    const definition = getResumeTemplateDefinition(draft.templateId);
                    const kindLabel = definition?.kind === 'cv' ? 'CV' : 'Resume';
                    return (
                      <li key={draft.id}>
                        <div
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.9rem',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700 }}>{draft.documentTitle}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              {definition?.name ?? dashboardCopy.customTemplateFallback} · {kindLabel} · Updated{' '}
                              {draft.updatedAt.toLocaleDateString()} · {formatLanguageLabel(draft.language)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={async () => {
                                await hydrateFromDraft(draft.id);
                                setActiveSection('resume');
                                setViewMode('edit');
                              }}
                              style={{
                                padding: '0.6rem 1.1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #0f172a',
                                background: '#fff',
                                color: '#0f172a',
                                fontWeight: 600,
                              }}
                            >
                              {dashboardCopy.editAction}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await hydrateFromDraft(draft.id);
                                setActiveSection('resume');
                                setViewMode('preview');
                              }}
                              style={{
                                padding: '0.6rem 1.1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #1d4ed8',
                                background: '#1d4ed8',
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            >
                              {dashboardCopy.previewAction}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
          {activeSection === 'downloads' && (
            <section
              style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'grid', gap: '1.25rem' }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{dashboardCopy.downloadsHeading}</h1>
                <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>{dashboardCopy.downloadsCopy}</p>
              </div>
              {loadingDownloads ? (
                <p style={{ color: '#64748b' }}>{dashboardCopy.downloadsLoading}</p>
              ) : downloads.length === 0 ? (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '0.85rem',
                    border: '1px dashed #cbd5f5',
                    background: '#f8fafc',
                  }}
                >
                  <p style={{ margin: 0, color: '#64748b' }}>{dashboardCopy.downloadsEmpty}</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>{dashboardCopy.downloadsColumns.document}</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>{dashboardCopy.downloadsColumns.template}</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>{dashboardCopy.downloadsColumns.language}</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>{dashboardCopy.downloadsColumns.plan}</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>{dashboardCopy.downloadsColumns.created}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downloads.map((download) => {
                        const definition = getResumeTemplateDefinition(download.templateId);
                        return (
                          <tr key={download.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{download.documentTitle}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{definition?.name ?? download.templateId}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{formatLanguageLabel(download.language)}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{(download.plan ?? entitlements?.plan ?? 'free').toUpperCase()}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {download.createdAt ? download.createdAt.toLocaleString() : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {entitlements && (
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#ecfeff', minWidth: '200px' }}>
                    <strong>Downloads remaining</strong>
                    <div style={{ fontSize: '1.2rem' }}>{entitlements.remainingDownloads}</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#eef2ff', minWidth: '200px' }}>
                    <strong>Plan</strong>
                    <div style={{ fontSize: '1.2rem' }}>{entitlements.plan.toUpperCase()}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => syncSubscription()}
                    disabled={syncingSubscription}
                    style={{
                      alignSelf: 'center',
                      padding: '0.65rem 1.1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #1d4ed8',
                      background: syncingSubscription ? '#c7d2fe' : '#1d4ed8',
                      color: syncingSubscription ? '#1e3a8a' : '#fff',
                      fontWeight: 600,
                      cursor: syncingSubscription ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {syncingSubscription ? 'Syncing…' : 'Refresh subscription'}
                  </button>
                </div>
              )}
            </section>
          )}
          {activeSection === 'settings' && (
            <section
              style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'grid', gap: '1.5rem' }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Settings</h1>
                <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>
                  Manage your account details and workspace preferences.
                </p>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1.25rem', display: 'grid', gap: '0.5rem' }}>
                  <strong>Account</strong>
                  <span style={{ color: '#475569' }}>Signed in as {user?.email}</span>
                  {profile && (
                    <span style={{ color: '#64748b' }}>Role: {profile.role?.toUpperCase?.() ?? 'USER'}</span>
                  )}
                </div>
                {entitlements && (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1.25rem', display: 'grid', gap: '0.5rem' }}>
                    <strong>Subscription</strong>
                    <span style={{ color: '#475569' }}>Plan: {entitlements.plan.toUpperCase()}</span>
                    <span style={{ color: '#475569' }}>Remaining downloads: {entitlements.remainingDownloads}</span>
                    {profile?.subscription && (
                      <>
                        <span style={{ color: '#64748b' }}>
                          Subscription status: {profile.subscription.status ?? 'unknown'}
                        </span>
                        {profile.subscription.currentPeriodEnd && (
                          <span style={{ color: '#64748b' }}>
                            Current period ends on {profile.subscription.currentPeriodEnd.toLocaleDateString()}
                          </span>
                        )}
                      </>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {entitlements.plan === 'free' ? (
                        <button
                          type="button"
                          onClick={startCheckout}
                          disabled={startingCheckout}
                          style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '0.75rem',
                            border: '1px solid #15803d',
                            background: startingCheckout ? '#bbf7d0' : '#16a34a',
                            color: startingCheckout ? '#166534' : '#fff',
                            fontWeight: 600,
                            cursor: startingCheckout ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {startingCheckout ? 'Connecting…' : 'Upgrade to Pro'}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={openBillingPortal}
                            disabled={openingPortal}
                            style={{
                              padding: '0.6rem 1.2rem',
                              borderRadius: '0.75rem',
                              border: '1px solid #1d4ed8',
                              background: openingPortal ? '#c7d2fe' : '#1d4ed8',
                              color: openingPortal ? '#1e3a8a' : '#fff',
                              fontWeight: 600,
                              cursor: openingPortal ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {openingPortal ? 'Opening…' : 'Manage billing'}
                          </button>
                          <button
                            type="button"
                            onClick={() => syncSubscription()}
                            disabled={syncingSubscription}
                            style={{
                              padding: '0.6rem 1.2rem',
                              borderRadius: '0.75rem',
                              border: '1px solid #0f172a',
                              background: '#fff',
                              color: '#0f172a',
                              fontWeight: 600,
                              cursor: syncingSubscription ? 'not-allowed' : 'pointer',
                              opacity: syncingSubscription ? 0.6 : 1,
                            }}
                          >
                            {syncingSubscription ? 'Syncing…' : 'Refresh status'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={refreshProfile}
                style={{
                  justifySelf: 'start',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #1d4ed8',
                  background: '#1d4ed8',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                Refresh account data
              </button>
            </section>
          )}
        </div>
        </div>
      </section>
    </>
  );
}
