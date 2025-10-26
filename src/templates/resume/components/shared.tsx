import { ResumeDraftContent, ExperienceEntry, EducationEntry } from '@/types/resume';

export function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return undefined;
  if (start && end) return `${start} – ${end}`;
  return start ? `${start} – Present` : end;
}

export function groupExperiencesByCategory(experiences: ExperienceEntry[]) {
  return experiences.reduce<Record<string, ExperienceEntry[]>>((accumulator, experience) => {
    const key = experience.category ?? 'Experience';
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(experience);
    return accumulator;
  }, {});
}

export function firstEducation(education: EducationEntry[]) {
  return education.length > 0 ? education[0] : undefined;
}

export interface TemplatePreviewProps {
  content: ResumeDraftContent;
}
