'use client';

import Link from 'next/link';
import { cloneElement, isValidElement, useCallback, useEffect, useMemo, useState } from 'react';
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
  limit,
  query,
  runTransaction,
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

export function ResumeDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const { copy } = useLocalization();
  const dashboardCopy = copy.resumeDashboard;
  const statuses = dashboardCopy.statuses;
  const [drafts, setDrafts] = useState<ResumeDraft[]>([]);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [form, setForm] = useState<DraftFormState>(() => {
    const definition = getResumeTemplateDefinition(defaultTemplateId);
    const defaultContent = deepClone(
      definition?.defaultContent ?? resumeTemplateDefinitions['aria-stark'].defaultContent
    );
    return {
      ...defaultContent,
      language: defaultContent.language ?? 'en',
      templateId: definition?.id ?? defaultTemplateId,
    };
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [activeSection, setActiveSection] = useState<DashboardSection>('resume');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [syncingSubscription, setSyncingSubscription] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [redeemingToken, setRedeemingToken] = useState(false);

  const entitlements = profile?.entitlements;
  const downloadsDepleted = Boolean(entitlements) && (entitlements?.remainingDownloads ?? 0) <= 0;
  const tokensAvailable = entitlements?.tokens ?? 0;
  const nextRefreshAt = entitlements?.nextRefreshAt ?? null;
  const nextRefreshDisplay = nextRefreshAt ? nextRefreshAt.toLocaleString() : '—';
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
        setStatus(statuses.loadTemplatesError);
      }
    };

    loadTemplates();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setDrafts([]);
      setLoadingDrafts(false);
      return;
    }
    setLoadingDrafts(true);

    const draftsQuery = query(
      collection(db, 'drafts'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

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
          .filter(Boolean) as ResumeDraft[];

        setDrafts(parsed);
        setLoadingDrafts(false);
      },
      (error) => {
        console.error('Failed to load drafts', error);
        setStatus(statuses.loadDraftsError);
        setLoadingDrafts(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setDownloads([]);
      setLoadingDownloads(false);
      return;
    }

    const downloadsQuery = query(
      collection(db, 'downloads'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      downloadsQuery,
      (snapshot) => {
        const rows: DownloadLog[] = snapshot.docs.map((document) => {
          const data = document.data();
          return {
            id: document.id,
            documentTitle: (data.documentTitle as string) ?? 'Untitled resume',
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
        setStatus(statuses.loadDownloadsError);
        setLoadingDownloads(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const selectedTemplateDefinition = useMemo(
    () => getResumeTemplateDefinition(form.templateId) ?? resumeTemplateDefinitions[defaultTemplateId],
    [form.templateId]
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

  const isCustomLanguage = !LANGUAGE_OPTIONS.some((option) => option.value === form.language);
  const selectedLanguageValue = isCustomLanguage ? 'custom' : form.language;

  const syncSubscription = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) {
        setStatus(statuses.signInRequired);
        return;
      }
      setSyncingSubscription(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await refreshProfile();
        if (!options?.silent) {
          setStatus(statuses.subscriptionRefreshed);
        }
      } catch (error) {
        console.error('Demo subscription sync failed', error);
        setStatus(statuses.subscriptionRefreshFailed);
      } finally {
        setSyncingSubscription(false);
      }
    },
    [refreshProfile, user]
  );

  const startCheckout = useCallback(async () => {
    if (!user) {
      setStatus(statuses.upgradeSignInRequired);
      return;
    }
    setStartingCheckout(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setStatus(statuses.checkoutDemo);
    } catch (error) {
      console.error('Demo checkout trigger failed', error);
      setStatus(statuses.checkoutFailed);
    } finally {
      setStartingCheckout(false);
    }
  }, [user]);

  const openBillingPortal = useCallback(async () => {
    if (!user) {
      setStatus(statuses.billingSignInRequired);
      return;
    }
    setOpeningPortal(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStatus(statuses.billingDisabled);
    } catch (error) {
      console.error('Demo billing portal error', error);
      setStatus(statuses.billingError);
    } finally {
      setOpeningPortal(false);
    }
  }, [user]);

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
        setStatus(statuses.subscriptionUpgraded);
      });
    } else if (upgradeStatus === 'cancelled') {
      setStatus(statuses.checkoutCancelled);
    }
    params.delete('upgrade');
    const newQuery = params.toString();
    const nextUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [syncSubscription, user]);

  const hydrateFromTemplate = (templateId: string) => {
    const definition = getResumeTemplateDefinition(templateId);
    if (!definition) return;

    const content = deepClone(definition.defaultContent);

    setForm({
      ...content,
      language: content.language ?? 'en',
      templateId: definition.id,
      id: undefined,
    });
    setViewMode('edit');
    setStatus(`Loaded the ${definition.name} template.`);
    setActiveSection('resume');
  };

  const hydrateFromDraft = async (draftId: string) => {
    try {
      const ref = doc(db, 'drafts', draftId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        setStatus(statuses.draftNotFound);
        return;
      }

      const data = snapshot.data();
      const templateId = (data.templateId as string) ?? defaultTemplateId;
      const definition = getResumeTemplateDefinition(templateId) ?? resumeTemplateDefinitions[defaultTemplateId];
      const language = (data.language as string | undefined) ?? definition.defaultContent.language ?? 'en';

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
      setStatus(statuses.draftLoaded);
      setActiveSection('resume');
    } catch (error) {
      console.error(error);
      setStatus(statuses.draftLoadFailed);
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

  const handleLanguageSelectChange = (value: string) => {
    setForm((previous) => {
      const nextLanguage =
        value === 'custom'
          ? LANGUAGE_OPTIONS.some((option) => option.value === previous.language) ? '' : previous.language
          : value;
      return { ...previous, language: nextLanguage };
    });
  };

  const handleCustomLanguageChange = (value: string) => {
    setForm((previous) => ({ ...previous, language: value }));
  };

  const saveDraft = async (): Promise<string | null> => {
    if (!user) return null;
    if (!form.documentTitle.trim()) {
      setStatus(statuses.missingTitle);
      return null;
    }

    try {
      const payload = {
        ownerId: user.uid,
        templateId: form.templateId,
        documentTitle: form.documentTitle,
        language: form.language || 'en',
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
        setStatus(statuses.draftUpdated);
        return form.id;
      }

      const ref = await addDoc(collection(db, 'drafts'), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      setForm((previous) => ({ ...previous, id: ref.id }));
      setStatus(statuses.draftCreated);
      return ref.id;
    } catch (error) {
      console.error(error);
      setStatus(statuses.draftSaveFailed);
      return null;
    }
  };

  const redeemTokenForDownload = async () => {
    if (!user) {
      setStatus(statuses.signInRequired);
      return;
    }
    if (!entitlements) {
      setStatus(statuses.missingEntitlements);
      return;
    }
    if ((entitlements.tokens ?? 0) <= 0) {
      setStatus(statuses.noTokens);
      return;
    }

    setRedeemingToken(true);
    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, 'users', user.uid);
        const snapshot = await transaction.get(ref);
        const data = snapshot.data();
        const currentTokens =
          typeof data?.entitlements?.tokens === 'number' ? data.entitlements.tokens : 0;
        if (currentTokens <= 0) {
          throw new Error('NO_TOKENS');
        }
        const currentDownloads =
          typeof data?.entitlements?.remainingDownloads === 'number'
            ? data.entitlements.remainingDownloads
            : 0;
        transaction.update(ref, {
          'entitlements.tokens': currentTokens - 1,
          'entitlements.remainingDownloads': currentDownloads + 1,
        });
      });
      await refreshProfile();
      setStatus(statuses.tokenRedeemed);
    } catch (error) {
      if ((error as Error)?.message === 'NO_TOKENS') {
        setStatus(statuses.noTokens);
      } else {
        console.error('Failed to redeem token', error);
        setStatus(statuses.tokenRedeemFailed);
      }
    } finally {
      setRedeemingToken(false);
    }
  };

  const generatePdf = async () => {
    if (!entitlements) {
      setStatus(statuses.missingEntitlements);
      return;
    }
    if (entitlements.remainingDownloads <= 0) {
      if ((entitlements.tokens ?? 0) > 0) {
        setStatus(statuses.downloadTokensAvailable);
      } else {
        setStatus(statuses.downloadLimitReached);
      }
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

      if (user) {
        try {
          await addDoc(collection(db, 'downloads'), {
            userId: user.uid,
            draftId,
            templateId: form.templateId,
            documentTitle: form.documentTitle,
            language: form.language,
            plan: entitlements.plan,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('Failed to record download event', error);
        }
      }

      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            'entitlements.remainingDownloads': increment(-1),
          });
        } catch (error) {
          console.error('Failed to decrement download allowance', error);
        }
        await refreshProfile();
      }
      setStatus(statuses.pdfSuccess);
    } catch (error) {
      console.error(error);
      setStatus(statuses.pdfFailed);
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
    setViewMode('edit');
    setStatus(statuses.editorReset);
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
                      background: downloadsDepleted ? '#fee2e2' : '#ecfeff',
                      borderRadius: '0.75rem',
                      padding: '0.65rem 0.95rem',
                      display: 'grid',
                      gap: '0.2rem',
                      minWidth: '160px',
                      border: downloadsDepleted
                        ? '1px solid #fecaca'
                        : '1px solid rgba(14, 165, 233, 0.35)',
                      color: downloadsDepleted ? '#b91c1c' : '#0f172a',
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
                    <span style={{ fontWeight: 700 }}>{entitlements.remainingDownloads}</span>
                  </div>
                  {entitlements.plan !== 'pro' && (
                    <Link
                      href="/#pricing"
                      prefetch={false}
                      style={{
                        border: '1px solid rgba(37, 99, 235, 0.4)',
                        background: '#2563eb',
                        color: '#fff',
                        padding: '0.55rem 1.1rem',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        boxShadow: '0 12px 28px -18px rgba(37, 99, 235, 0.6)',
                      }}
                    >
                      {dashboardCopy.subscribeCta}
                    </Link>
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
                        background: downloadsDepleted ? '#fee2e2' : '#ecfeff',
                        minWidth: '200px',
                        color: downloadsDepleted ? '#b91c1c' : '#0f172a',
                        border: downloadsDepleted ? '1px solid #fecaca' : 'none',
                      }}
                    >
                      <strong>{dashboardCopy.downloadsLeftLabel}</strong>
                      <div style={{ fontSize: '1.2rem' }}>{entitlements.remainingDownloads}</div>
                    </div>
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: '#fefce8',
                        minWidth: '240px',
                        display: 'grid',
                        gap: '0.6rem',
                        border: '1px solid rgba(202, 138, 4, 0.25)',
                      }}
                    >
                      <div>
                        <strong>{dashboardCopy.tokenBalanceLabel}</strong>
                        <div style={{ fontSize: '1.2rem' }}>{tokensAvailable}</div>
                      </div>
                      <button
                        type="button"
                        onClick={redeemTokenForDownload}
                        disabled={redeemingToken || tokensAvailable <= 0}
                        style={{
                          border: 'none',
                          background: tokensAvailable > 0 ? '#f59e0b' : '#f1f5f9',
                          color: tokensAvailable > 0 ? '#fff' : '#64748b',
                          padding: '0.65rem 1rem',
                          borderRadius: '0.65rem',
                          fontWeight: 600,
                          cursor: redeemingToken || tokensAvailable <= 0 ? 'not-allowed' : 'pointer',
                          boxShadow:
                            tokensAvailable > 0
                              ? '0 18px 36px -24px rgba(245, 158, 11, 0.65)'
                              : 'none',
                        }}
                      >
                        {redeemingToken ? dashboardCopy.tokenRedeemLoading : dashboardCopy.tokenRedeemCta}
                      </button>
                      <span style={{ fontSize: '0.85rem', color: '#854d0e' }}>
                        {tokensAvailable <= 0 ? dashboardCopy.tokenEmpty : dashboardCopy.tokenInfo}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: '#f8fafc',
                        minWidth: '220px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                      }}
                    >
                      <strong>{dashboardCopy.nextRefreshLabel}</strong>
                      <div style={{ fontSize: '1.1rem' }}>{nextRefreshDisplay}</div>
                    </div>
                  </div>
                )}
                {downloadsDepleted && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      background: tokensAvailable > 0 ? '#fef9c3' : '#fef2f2',
                      color: tokensAvailable > 0 ? '#92400e' : '#b91c1c',
                      fontWeight: 600,
                      display: 'grid',
                      gap: '0.35rem',
                    }}
                  >
                    <span>
                      {tokensAvailable > 0
                        ? statuses.downloadTokensAvailable
                        : dashboardCopy.downloadLimitExceeded}
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {tokensAvailable > 0 ? dashboardCopy.tokenInfo : dashboardCopy.downloadResetByAdmin}
                    </span>
                  </div>
                )}
                {status && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 600,
                    }}
                  >
                    {status}
                  </div>
                )}
              </div>

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
                  Language: {formatLanguageLabel(form.language)}
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

                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Language</span>
                  <select
                    value={selectedLanguageValue}
                    onChange={(event) => handleLanguageSelectChange(event.target.value)}
                    style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                </label>

                {isCustomLanguage && (
                  <label style={{ display: 'grid', gap: '0.35rem' }}>
                    <span>Custom language</span>
                    <input
                      type="text"
                      value={form.language}
                      onChange={(event) => handleCustomLanguageChange(event.target.value)}
                      style={{ padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #cbd5f5' }}
                      placeholder="e.g. 日本語 or Portuguese"
                    />
                  </label>
                )}

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
  );
}
