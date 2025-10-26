export interface ResumeDraft {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  experience: string;
  skills: string[];
  templateId?: string;
  updatedAt: Date;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  headline: string;
  defaultSummary: string;
  defaultSkills: string[];
}

export interface Entitlement {
  plan: 'free' | 'pro';
  remainingDownloads: number;
}
