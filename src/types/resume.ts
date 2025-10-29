export type DocumentKind = 'resume' | 'cv';

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  location?: string;
}

export interface ProfileInfo {
  fullName: string;
  role: string;
  tagline?: string;
  contact: ContactInfo;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  category?: string;
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  details?: string[];
}

export interface SkillGroup {
  id: string;
  title: string;
  skills: string[];
  placement?: 'sidebar' | 'main';
}

export interface ListSection {
  id: string;
  title: string;
  items: string[];
  placement?: 'sidebar' | 'main';
}

export interface CertificationEntry {
  id: string;
  name: string;
  organization?: string;
  date?: string;
}

export interface ResumeDraftContent {
  documentTitle: string;
  language: string;
  profile: ProfileInfo;
  summary?: string;
  objective?: string;
  workExperiences: ExperienceEntry[];
  education: EducationEntry[];
  skillGroups: SkillGroup[];
  listSections: ListSection[];
  certifications: CertificationEntry[];
}

export interface ResumeDraft extends ResumeDraftContent {
  id: string;
  ownerId: string;
  templateId: string;
  updatedAt: Date;
  createdAt?: Date;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  kind: DocumentKind;
  description: string;
  accentColor: string;
}

export interface Entitlement {
  plan: 'free' | 'pro';
  remainingDownloads: number | null;
  nextRefreshAt?: Date | null;
}
