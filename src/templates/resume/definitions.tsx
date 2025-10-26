import { ReactNode } from 'react';
import { ResumeDraftContent, ResumeTemplate } from '@/types/resume';
import { AriaTemplate } from './components/AriaTemplate';
import { SashaTemplate } from './components/SashaTemplate';
import { SamanthaTemplate } from './components/SamanthaTemplate';
import { CatherineTemplate } from './components/CatherineTemplate';
import { JapaneseTemplate } from './components/JapaneseTemplate';
import { TurnerCvTemplate } from './components/TurnerCvTemplate';

export interface ResumeTemplateDefinition extends ResumeTemplate {
  defaultContent: ResumeDraftContent;
  renderPreview: (content: ResumeDraftContent) => ReactNode;
}

const ariaContent: ResumeDraftContent = {
  documentTitle: 'Aria Stark Resume',
  language: 'en',
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
  language: 'en',
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
  language: 'en',
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
  language: 'en',
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

const japaneseContent: ResumeDraftContent = {
  documentTitle: '山田太郎 履歴書',
  language: 'ja',
  profile: {
    fullName: '山田 太郎',
    role: '営業職 志望',
    contact: {
      email: 'taro.yamada@example.com',
      phone: '080-1234-5678',
      location: '東京都渋谷区',
    },
  },
  objective:
    '御社の法人向けソリューションを国内市場に広め、顧客課題の解決に寄与したいと考えて応募いたしました。営業として培った傾聴力と提案力を活かし、新規開拓と既存顧客の深耕の両軸で成果を上げる所存です。',
  summary:
    '前職ではSaaSスタートアップでフィールドセールスとして従事し、年間契約額1.2億円を担当。提案書の標準化と商談レビューの仕組み化を通じてチームの受注率を18%向上させた経験があります。',
  workExperiences: [
    {
      id: 'jp-exp-1',
      title: 'フィールドセールス',
      company: '株式会社リンクソリューション',
      location: '東京都渋谷区',
      startDate: '2020-04',
      endDate: '2023-12',
      bullets: [
        '中堅製造業を中心に40社を担当し、年間契約額1.2億円を達成。',
        '商談プロセスを可視化する仕組みを構築し、チーム全体の受注率を18%向上。',
        '新機能のβテストを牽引し、顧客要望をプロダクトロードマップに反映。',
      ],
    },
    {
      id: 'jp-exp-2',
      title: 'インサイドセールス',
      company: '株式会社リンクソリューション',
      location: '東京都渋谷区',
      startDate: '2018-04',
      endDate: '2020-03',
      bullets: [
        'リード育成プログラムを刷新し、SQL創出数を前年比160%に拡大。',
        'マーケティングと連携し、業界別ウェビナーの企画運営を担当。',
      ],
    },
  ],
  education: [
    {
      id: 'jp-edu-1',
      school: '東京都立西高校',
      degree: '入学',
      startDate: '2011-04',
    },
    {
      id: 'jp-edu-1-grad',
      school: '東京都立西高校',
      degree: '卒業',
      startDate: '2014-03',
    },
    {
      id: 'jp-edu-2',
      school: '早稲田大学 商学部',
      degree: '入学',
      location: '東京都新宿区',
      startDate: '2014-04',
    },
    {
      id: 'jp-edu-2-grad',
      school: '早稲田大学 商学部',
      degree: '卒業',
      startDate: '2018-03',
    },
  ],
  skillGroups: [
    {
      id: 'jp-skills',
      title: 'スキル',
      skills: ['法人営業', 'SaaS提案', 'Salesforce', '課題ヒアリング', 'KPI設計'],
    },
  ],
  listSections: [
    {
      id: 'japanese-furigana',
      title: 'ふりがな',
      items: ['やまだ たろう'],
    },
    {
      id: 'japanese-personal',
      title: '個人情報',
      items: ['1995年4月12日生（満28歳）', '男', '通勤時間 45分'],
    },
    {
      id: 'japanese-address',
      title: '住所',
      items: ['〒150-0002 東京都渋谷区渋谷1-2-3 サンプルマンション301号', '最寄駅 代々木上原駅'],
    },
    {
      id: 'japanese-household',
      title: '家族状況',
      items: ['扶養家族（配偶者を除く） 1人', '配偶者 あり・扶養義務 あり'],
    },
    {
      id: 'japanese-emergency',
      title: '緊急連絡先',
      items: ['山田 花子（母）', '東京都世田谷区', '03-3456-7890'],
    },
    {
      id: 'japanese-hobbies',
      title: '趣味・特技',
      items: ['ランニング', '写真撮影', 'カフェ巡り'],
    },
    {
      id: 'japanese-licenses',
      title: '免許・資格',
      items: ['2018-06|普通自動車第一種免許 取得', '2020-09|TOEIC L&R 860点'],
    },
    {
      id: 'japanese-remarks',
      title: '本人希望欄',
      items: ['勤務地：東京本社を希望（全国転勤可）', '入社可能時期：2024年5月1日'],
    },
  ],
  certifications: [],
};

const turnerContent: ResumeDraftContent = {
  documentTitle: 'Eric Turner CV',
  language: 'en',
  profile: {
    fullName: 'Eric Turner',
    role: 'Financial Analyst',
    tagline: 'UC Berkeley',
    contact: {
      phone: '+1 (415) 555-9823',
      email: 'eric.turner@email.com',
      location: 'San Francisco, CA',
      website: 'linkedin.com/in/ericturner',
    },
  },
  summary:
    'Global finance professional with eight years of experience building investment models, supporting public-sector audits, and guiding capital allocation decisions for high-growth teams.',
  objective:
    'Seeking a senior finance role that blends portfolio analytics with mission-driven strategy, enabling organizations to scale responsibly across international markets.',
  workExperiences: [
    {
      id: 'turner-exp-1',
      category: 'Professional Experience',
      title: 'Senior Financial Analyst',
      company: 'Pacific Ridge Capital',
      location: 'San Francisco, CA',
      startDate: '2021',
      endDate: 'Present',
      bullets: [
        'Lead quarterly scenario planning across five business units, synthesising pricing, FX, and headcount inputs into a unified cash-flow forecast.',
        'Partner with GTM leadership to redesign KPI dashboards that track ARR, retention, and CAC payback, resulting in a 14% improvement in forecast accuracy.',
      ],
    },
    {
      id: 'turner-exp-2',
      category: 'Professional Experience',
      title: 'Financial Analyst',
      company: 'North Coast Advisory',
      location: 'Los Angeles, CA',
      startDate: '2017',
      endDate: '2021',
      bullets: [
        'Built valuation models for public-private partnership bids exceeding $120M, incorporating sensitivity analyses and regulatory constraints.',
        'Implemented variance analysis routines that reduced monthly close timelines by three business days.',
      ],
    },
    {
      id: 'turner-vol-1',
      category: 'Volunteer Experience',
      title: 'Nonprofit Board Analyst',
      company: 'Santa Monica Alliance to End Homelessness',
      location: 'Santa Monica, CA',
      startDate: '2019',
      endDate: 'Present',
      bullets: [
        'Oversee a $2.3M operating budget, aligning donor commitments with shelter expansion milestones.',
        'Facilitated quarterly workshops for regional partners to coordinate data-sharing and grant compliance.',
      ],
    },
    {
      id: 'turner-vol-2',
      category: 'Volunteer Experience',
      title: 'Volunteer Financial Analyst',
      company: 'Pacific Ridge Community College Venture Fund',
      location: 'Los Angeles, CA',
      startDate: '2017',
      endDate: '2020',
      bullets: [
        'Mentored student founders on cash-flow management and pricing strategy during semester-long accelerator programmes.',
      ],
    },
    {
      id: 'turner-vol-3',
      category: 'Volunteer Experience',
      title: 'Volunteer Tutor',
      company: 'Room to Read',
      location: 'San Francisco, CA',
      startDate: '2020',
      endDate: 'Present',
      bullets: ['Provide weekly financial literacy coaching for first-generation college applicants.'],
    },
  ],
  education: [
    {
      id: 'turner-edu-1',
      school: 'University of California, Berkeley',
      degree: 'Master of Financial Engineering',
      startDate: '2015',
      endDate: '2016',
    },
    {
      id: 'turner-edu-2',
      school: 'Santa Monica University',
      degree: 'Bachelor of Science in Finance',
      startDate: '2011',
      endDate: '2015',
    },
  ],
  skillGroups: [
    {
      id: 'turner-languages',
      title: 'Languages',
      skills: ['English — Native', 'Japanese — Conversational', 'Spanish — Professional Working Proficiency'],
    },
    {
      id: 'turner-certifications',
      title: 'Technical Proficiencies',
      skills: ['Power BI & Tableau', 'SQL & Python (pandas)', 'Adaptive Planning', 'Advanced Excel (Power Pivot)'],
    },
  ],
  listSections: [
    {
      id: 'turner-courses-left',
      title: 'Courses & Training (Left)',
      placement: 'main',
      items: [
        'Immersive Cost Analytics (LSE)',
        'Financial Statement Analysis (UCSF)',
        'Advanced Excel for Financial Modeling',
        'Derivatives (Options Trading Institute)',
      ],
    },
    {
      id: 'turner-courses-right',
      title: 'Courses & Training (Right)',
      placement: 'main',
      items: [
        'Advanced Public Sector Financial Reporting and Analysis',
        'Corporate Finance',
        'Financial Risk Management (GARP)',
        'Portfolio Simulation Workshop',
      ],
    },
    {
      id: 'turner-achievements-left',
      title: 'Achievements & Awards (Left)',
      placement: 'main',
      items: [
        'Civic Service Awardee (2018) — Santa Monica Community',
        'Leadership Fellowship (2019) — Berkeley Haas Center',
      ],
    },
    {
      id: 'turner-achievements-right',
      title: 'Achievements & Awards (Right)',
      placement: 'main',
      items: [
        'Peer Inc. Group of Companies Special Recognition (2017)',
        'Young Entrepreneur Summit Winner (2016)',
      ],
    },
    {
      id: 'turner-interests',
      title: 'Interests & Hobbies',
      placement: 'main',
      items: ['Machine Learning', 'Calligraphy', 'Astronomy', 'Photography'],
    },
    {
      id: 'turner-references',
      title: 'References',
      placement: 'main',
      items: [
        'Dana Patel — Director of Finance, Pacific Ridge Capital · danapatel@email.com · +1 (415) 555-1920',
        'Luis Hernández — Managing Director, North Coast Advisory · lhernandez@email.com · +1 (213) 555-4476',
      ],
    },
  ],
  certifications: [
    {
      id: 'turner-cert-1',
      name: 'Chartered Financial Analyst (CFA)',
      organization: 'CFA Institute',
      date: '2020',
    },
    {
      id: 'turner-cert-2',
      name: 'Certified Government Financial Manager (CGFM)',
      organization: 'Association of Government Accountants',
      date: '2018',
    },
  ],
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
  'turner-global-cv': {
    id: 'turner-global-cv',
    name: 'Eric Turner — Global Finance CV',
    kind: 'cv',
    description: 'Two-page finance CV with balanced columns, volunteer history, and language coverage.',
    accentColor: '#2563eb',
    defaultContent: turnerContent,
    renderPreview: (content) => <TurnerCvTemplate content={content} />,
  },
  'japanese-rirekisho': {
    id: 'japanese-rirekisho',
    name: '山田太郎 — 履歴書（日本語）',
    kind: 'resume',
    description: 'Traditional two-page Japanese rirekisho with structured sections and warm accent lines.',
    accentColor: '#dc2626',
    defaultContent: japaneseContent,
    renderPreview: (content) => <JapaneseTemplate content={content} />,
  },
};

export function getResumeTemplateDefinition(id?: string) {
  if (!id) return undefined;
  return resumeTemplateDefinitions[id];
}

export const resumeTemplateMetadata: ResumeTemplate[] = Object.values(resumeTemplateDefinitions).map(
  ({ defaultContent: _defaultContent, renderPreview: _renderPreview, ...metadata }) => metadata
);
