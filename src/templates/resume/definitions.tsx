import { ReactNode } from 'react';
import { ResumeDraftContent, ResumeTemplate } from '@/types/resume';
import { AriaTemplate } from './components/AriaTemplate';
import { SashaTemplate } from './components/SashaTemplate';
import { SamanthaTemplate } from './components/SamanthaTemplate';
import { CatherineTemplate } from './components/CatherineTemplate';

export interface ResumeTemplateDefinition extends ResumeTemplate {
  defaultContent: ResumeDraftContent;
  renderPreview: (content: ResumeDraftContent) => ReactNode;
}

const ariaContent: ResumeDraftContent = {
  documentTitle: 'Aria Stark Resume',
  profile: {
    fullName: 'Aria Stark',
    role: 'Technical Writer',
    contact: {
      email: 'ariastark@email.com',
      location: 'San Francisco, CA',
      phone: '(123) 555-1234',
      website: 'ariastark.com',
    },
  },
  summary:
    'Experienced Technical Writer with a strong background in creating internal guides, managing web content and implementing data-driven decisions for optimized web experiences. Skilled in copywriting across multiple marketing teams with a long and honorable history of deadliness.',
  objective: undefined,
  workExperiences: [
    {
      id: 'aria-exp-1',
      category: 'Work Experience',
      title: 'Technical Writer',
      company: 'Glowworm',
      location: 'Hybrid / San Francisco, CA',
      startDate: 'Feb 2021',
      endDate: 'Present',
      bullets: [
        'Published and shared focus on the implementation of internal guides, whitepapers, and enterprise-level documentation for newly onboarded employees.',
        'Maintained author level information and helped tailor design of workflow before drafting onto systems.',
        'Built incremental implementation plans with key stakeholders before focusing on cross-functional launching.',
      ],
    },
    {
      id: 'aria-exp-2',
      category: 'Work Experience',
      title: 'Copywriter',
      company: 'Anchor Electric',
      location: 'Remote',
      startDate: 'Jul 2019',
      endDate: 'Feb 2021',
      bullets: [
        'Collaborated with the product and engineering teams to develop experiences through data-driven approaches based on tracking and responding to live user data.',
        'Reduced documentation deployment lag by 30% by leading engineering to improve how their data reports are used in each stage of the project development and deployment lifecycle.',
      ],
    },
  ],
  education: [
    {
      id: 'aria-edu-1',
      school: 'University of Florida',
      degree: 'Bachelor of Arts Journalism and Media',
      startDate: 'Aug 2014',
      endDate: 'Dec 2018',
    },
  ],
  skillGroups: [
    {
      id: 'aria-skills',
      title: 'Core Skills',
      skills: ['Copywriting', 'SEO Strategy', 'Content Planning', 'Information Architecture'],
    },
  ],
  listSections: [],
  certifications: [],
};

const sashaContent: ResumeDraftContent = {
  documentTitle: 'Sasha Wagner Resume',
  profile: {
    fullName: 'Sasha Wagner',
    role: 'Digital Marketing Analyst',
    contact: {
      email: 'sashawagner@email.com',
      phone: '(123) 456-7890',
      location: 'Saint Paul, MN',
      linkedin: 'linkedin.com/in/sasha',
    },
  },
  summary: undefined,
  objective:
    'Soon-to-be marketing graduate (2022) with a passion for developing scalable acquisition strategies through digital advertising and SEO. I have experience creating and managing Facebook ad campaigns, while also building expertise in paid search optimization to help local organizations start and grow user acquisition, skills that will positively impact strategic alignment and execution at Capstone.',
  workExperiences: [
    {
      id: 'sasha-exp-1',
      title: 'Digital Marketing Analyst Intern',
      company: 'Marketing Science Associates',
      location: 'Saint Paul, MN',
      startDate: 'Apr 2021',
      endDate: 'Current',
      bullets: [
        'Interviewed 50+ customers to inform value propositions for two product positioning strategies designed to increase adoption from independent contractors.',
        'Scaled Facebook ad campaigns that drove a 36% increase in on-site conversions quarter over quarter.',
        'Authored a weekly marketing performance report to align stakeholders on campaign insights and next steps.',
      ],
    },
    {
      id: 'sasha-exp-2',
      title: 'Marketing Assistant',
      company: 'Capstone',
      location: 'Remote',
      startDate: 'Sep 2020',
      endDate: 'May 2021',
      bullets: [
        'Led content calendar revamp for Capstone blog resulting in a 42% increase in organic traffic over three months.',
        'Managed a cross-functional project team to audit ad account structure and implement new naming conventions.',
      ],
    },
  ],
  education: [
    {
      id: 'sasha-edu-1',
      school: 'University of St. Thomas',
      degree: 'B.S. in Marketing, GPA: 3.65',
      location: 'Saint Paul, MN',
      startDate: 'Aug 2018',
      endDate: 'May 2022',
    },
  ],
  skillGroups: [
    {
      id: 'sasha-hard',
      title: 'Hard Skills',
      placement: 'sidebar',
      skills: ['Google Analytics', 'Meta Ads Manager', 'SQL', 'Tableau', 'Excel & Sheets'],
    },
    {
      id: 'sasha-soft',
      title: 'Soft Skills',
      placement: 'sidebar',
      skills: ['Creative Strategy', 'Collaboration', 'Client Presentations', 'Experimentation'],
    },
    {
      id: 'sasha-main',
      title: 'Skills',
      placement: 'main',
      skills: ['Competitive Research', 'Media Planning', 'Conversion Optimization'],
    },
  ],
  listSections: [
    {
      id: 'sasha-courses',
      title: 'Relevant Courses',
      placement: 'sidebar',
      items: ['Consumer Behavior', 'Marketing Research', 'Salesforce Management', 'Electronic Commerce'],
    },
    {
      id: 'sasha-tools',
      title: 'Tools',
      placement: 'sidebar',
      items: ['Microsoft Office', 'Google Workspace', 'Notion', 'Adobe Suite'],
    },
  ],
  certifications: [],
};

const samanthaContent: ResumeDraftContent = {
  documentTitle: 'Samantha Carter Resume',
  profile: {
    fullName: 'Samantha L. Carter',
    role: 'Nursing Student',
    contact: {
      phone: '(555) 987-6543',
      email: 'sam.carter@email.com',
      location: 'Denver, CO',
      linkedin: 'linkedin.com/in/samantha-carter',
    },
  },
  summary:
    'Compassionate and detail-oriented, BLS and CNA-certified nursing student with 150+ hours of clinical simulation experience, seeking a Student Nurse position at Mercy Hospital in Denver, CO. Skilled in patient assessments, medication administration, and EMR documentation, aiming to enhance patient care and support the team in delivering high-quality healthcare outcomes.',
  objective: undefined,
  workExperiences: [
    {
      id: 'sam-exp-1',
      title: 'Nursing Assistant',
      company: 'Brighton Health Center',
      location: 'Denver, CO',
      startDate: 'Jun 2023',
      endDate: 'Aug 2023',
      bullets: [
        'Assisted nurses with patient intake, collecting vital signs, and preparing treatment areas.',
        'Supported patient mobility, documentation, and comfort, leading to a 20% increase in positive patient feedback surveys.',
      ],
    },
    {
      id: 'sam-exp-2',
      title: 'Student Nurse',
      company: 'Mercy Hospital',
      location: 'Denver, CO',
      startDate: 'Jan 2024',
      endDate: 'Present',
      bullets: [
        'Worked alongside attending physicians and hospital staff to deliver compassionate care in emergency and pediatric units.',
        'Documented patient progress, medication administration, and discharge instructions, achieving increased accuracy in 90% of cases.',
      ],
    },
  ],
  education: [
    {
      id: 'sam-edu-1',
      school: 'University of Colorado, College of Nursing',
      degree: 'Bachelor of Science in Nursing',
      location: 'Denver, CO',
      startDate: 'Aug 2020',
      endDate: 'May 2024',
    },
  ],
  skillGroups: [
    {
      id: 'sam-skills',
      title: 'Skills',
      skills: ['Patient Assessment', 'Medication Administration', 'EMR Documentation', 'Patient Advocacy'],
    },
  ],
  listSections: [],
  certifications: [
    {
      id: 'sam-cert-1',
      name: 'Basic Life Support (BLS)',
      organization: 'American Heart Association',
      date: '12/01/25',
    },
    {
      id: 'sam-cert-2',
      name: 'Certified Nursing Assistant (CNA)',
      organization: 'Colorado State Board of Nursing',
      date: '06/01/22',
    },
    {
      id: 'sam-cert-3',
      name: 'First Aid Certification',
      organization: 'Red Cross',
      date: '11/01/25',
    },
    {
      id: 'sam-cert-4',
      name: 'Intravenous Therapy Certification',
      organization: 'Colorado Board of Nursing',
      date: '04/01/23',
    },
  ],
};

const catherineContent: ResumeDraftContent = {
  documentTitle: 'Catherine Barnett Resume',
  profile: {
    fullName: 'Catherine Barnett',
    role: '3D Character Animator',
    contact: {
      email: 'cath@nooraverse.com',
      phone: '425 444 5555',
      location: 'Montreal, Canada',
      linkedin: 'linkedin.com/in/cathy',
      website: 'cath-barnett.com',
    },
  },
  summary:
    'Hard-working animator with over six years of professional experience in 3D modeling, texturing, and character rigging for mixed reality experiences. Supervised artists in blending live-action and digital screens through rapid iteration and deep creative collaboration. Proficient user of Blender, Adobe After Effects, Photoshop, and Cinema4D.',
  objective: undefined,
  workExperiences: [
    {
      id: 'cat-exp-1',
      title: 'Lead Animator',
      company: 'Iceberg Games',
      location: 'Remote, Canada',
      startDate: '2019',
      endDate: 'Present',
      bullets: [
        'Worked on a high-pressure project delivering complex 3D cinematics for a AAA franchise release.',
        'Collaborated with designers and writers to match character story arcs to animation beats across 20 key sequences.',
        'Mentored a team of 6 junior animators, creating onboarding curriculum and peer review process to improve quality.',
      ],
    },
    {
      id: 'cat-exp-2',
      title: 'Animator and Designer',
      company: 'Sunset Studios',
      location: 'Montreal, QC',
      startDate: '2016',
      endDate: '2019',
      bullets: [
        'Supported 40+ short-form media projects with stylized character animations.',
        'Worked with engineering teams to optimize rendering pipeline, reducing costs by 22%.',
      ],
    },
  ],
  education: [
    {
      id: 'cat-edu-1',
      school: 'Vancouver Art University',
      degree: 'BFA in Animation',
      startDate: '2012',
      endDate: '2016',
    },
  ],
  skillGroups: [
    {
      id: 'cat-hard',
      title: 'Hard Skills',
      placement: 'sidebar',
      skills: ['Character-based VFX', '3D Modeling', 'Rigging', 'Lighting', 'Texturing'],
    },
    {
      id: 'cat-soft',
      title: 'Soft Skills',
      placement: 'sidebar',
      skills: ['Team Leadership', 'Storyboarding', 'Art Direction', 'Mentorship'],
    },
    {
      id: 'cat-main',
      title: 'Skills',
      placement: 'main',
      skills: ['Maya', 'Blender', 'Cinema4D', 'Substance Painter', 'Houdini'],
    },
  ],
  listSections: [
    {
      id: 'cat-languages',
      title: 'Languages',
      placement: 'sidebar',
      items: ['English', 'French'],
    },
    {
      id: 'cat-software',
      title: 'Software',
      placement: 'sidebar',
      items: ['Adobe Creative Suite', 'Unreal Engine 5', 'Unity', 'Figma'],
    },
  ],
  certifications: [],
};

export const resumeTemplateDefinitions: Record<string, ResumeTemplateDefinition> = {
  'aria-stark': {
    id: 'aria-stark',
    name: 'Aria Stark — Technical Writer',
    kind: 'resume',
    description: 'Clean editorial layout with bold typography and grouped experience sections.',
    accentColor: '#0f172a',
    defaultContent: ariaContent,
    renderPreview: (content) => <AriaTemplate content={content} />,
  },
  'sasha-wagner': {
    id: 'sasha-wagner',
    name: 'Sasha Wagner — Digital Marketing Analyst',
    kind: 'resume',
    description: 'Elegant split-column design with deep indigo sidebar for courses and tools.',
    accentColor: '#0f172a',
    defaultContent: sashaContent,
    renderPreview: (content) => <SashaTemplate content={content} />,
  },
  'samantha-carter': {
    id: 'samantha-carter',
    name: 'Samantha Carter — Nursing Student',
    kind: 'resume',
    description: 'Rounded card aesthetic with bold header and modular sections.',
    accentColor: '#0ea5e9',
    defaultContent: samanthaContent,
    renderPreview: (content) => <SamanthaTemplate content={content} />,
  },
  'catherine-barnett': {
    id: 'catherine-barnett',
    name: 'Catherine Barnett — 3D Character Animator',
    kind: 'resume',
    description: 'Modern two-column layout with dark sidebar and vibrant skill chips.',
    accentColor: '#1f2937',
    defaultContent: catherineContent,
    renderPreview: (content) => <CatherineTemplate content={content} />,
  },
};

export function getResumeTemplateDefinition(id?: string) {
  if (!id) return undefined;
  return resumeTemplateDefinitions[id];
}

export const resumeTemplateMetadata: ResumeTemplate[] = Object.values(resumeTemplateDefinitions).map(
  ({ defaultContent: _defaultContent, renderPreview: _renderPreview, ...metadata }) => metadata
);
