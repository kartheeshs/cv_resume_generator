import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeDraftContent } from '@/types/resume';

const isServer = typeof window === 'undefined';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeFs: typeof import('fs') | null = isServer ? require('fs') : null;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodePath: typeof import('path') | null = isServer ? require('path') : null;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeOs: typeof import('os') | null = isServer ? require('os') : null;

const DEFAULT_FONT_FAMILY = 'Helvetica';
const JAPANESE_FONT_FAMILY = 'NotoSansJP';

let fontsRegistered = false;
let japaneseFontAvailable = false;

type FontCandidate = {
  path: string;
  fontIndex?: number;
  postscriptName?: string;
};

const PATH_LIST_SEPARATOR = process.platform === 'win32' ? ';' : ':';

const japaneseCharacterPattern = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff01-\uff60\uff66-\uff9f\uffe0-\uffe6]/;

function pathListSeparator() {
  return PATH_LIST_SEPARATOR;
}

function normalizeCandidatePath(candidate: string): FontCandidate {
  if (!nodePath) {
    return { path: candidate };
  }

  const [rawPath, rawIndex] = candidate.split('::');

  const hasHomePrefix = rawPath.startsWith('~');
  const resolvedPath = hasHomePrefix && nodeOs
    ? nodePath.join(nodeOs.homedir(), rawPath.slice(1))
    : rawPath;

  if (rawIndex === undefined || rawIndex.length === 0) {
    return { path: resolvedPath };
  }

  const numericIndex = Number(rawIndex);

  if (Number.isFinite(numericIndex)) {
    return { path: resolvedPath, fontIndex: numericIndex };
  }

  return { path: resolvedPath, postscriptName: rawIndex };
}

function findExistingFont(candidates: string[]): FontCandidate | null {
  if (!nodeFs) {
    return null;
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeCandidatePath(candidate);
    try {
      if (nodeFs.existsSync(normalized.path)) {
        return normalized;
      }
    } catch (error) {
      // Ignore inaccessible candidates and continue searching.
    }
  }

  return null;
}

function ensurePdfFontsRegistered() {
  if (fontsRegistered) {
    return;
  }

  fontsRegistered = true;

  if (!nodePath) {
    return;
  }

  const projectRoot = process.cwd();

  const regularCandidates: string[] = [];
  const mediumCandidates: string[] = [];
  const boldCandidates: string[] = [];

  const pushCandidates = (target: string[], values: (string | undefined | null)[]) => {
    for (const value of values) {
      if (value) {
        target.push(value);
      }
    }
  };

  pushCandidates(regularCandidates, [
    process.env.PDF_JP_FONT_REGULAR,
    process.env.NOTO_SANS_JP_REGULAR_PATH,
  ]);
  pushCandidates(mediumCandidates, [
    process.env.PDF_JP_FONT_MEDIUM,
    process.env.NOTO_SANS_JP_MEDIUM_PATH,
  ]);
  pushCandidates(boldCandidates, [
    process.env.PDF_JP_FONT_BOLD,
    process.env.NOTO_SANS_JP_BOLD_PATH,
  ]);

  const projectFontCandidates = [
    nodePath.join(projectRoot, 'fonts'),
    nodePath.join(projectRoot, 'public', 'fonts'),
    nodePath.join(projectRoot, 'public', 'fonts', 'noto-sans-jp'),
    nodePath.join(projectRoot, 'src', 'templates', 'resume', 'fonts'),
  ];

  const configuredDirectories = process.env.PDF_JP_FONT_DIR
    ? process.env.PDF_JP_FONT_DIR.split(pathListSeparator())
    : [];

  for (const directory of configuredDirectories) {
    const trimmed = directory.trim();
    if (trimmed) {
      projectFontCandidates.push(trimmed);
    }
  }

  for (const base of projectFontCandidates) {
    pushCandidates(regularCandidates, [
      nodePath.join(base, 'NotoSansJP-Regular.otf'),
      nodePath.join(base, 'NotoSansJP-Regular.ttf'),
      nodePath.join(base, 'NotoSansCJKjp-Regular.otf'),
      nodePath.join(base, 'NotoSansCJK-Regular.otf'),
    ]);
    pushCandidates(mediumCandidates, [
      nodePath.join(base, 'NotoSansJP-Medium.otf'),
      nodePath.join(base, 'NotoSansJP-Medium.ttf'),
      nodePath.join(base, 'NotoSansJP-Regular.otf'),
    ]);
    pushCandidates(boldCandidates, [
      nodePath.join(base, 'NotoSansJP-Bold.otf'),
      nodePath.join(base, 'NotoSansJP-Bold.ttf'),
      nodePath.join(base, 'NotoSansCJKjp-Bold.otf'),
      nodePath.join(base, 'NotoSansCJK-Bold.otf'),
      nodePath.join(base, 'NotoSansJP-Medium.otf'),
      nodePath.join(base, 'NotoSansJP-Regular.otf'),
    ]);
  }

  pushCandidates(regularCandidates, [
    '/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.otf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc::0',
    '/usr/share/fonts/truetype/noto/NotoSansCJKjp-Regular.otf',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.otf',
    '/System/Library/Fonts/Supplemental/ヒラギノ角ゴシック W3.ttc::0',
    '/System/Library/Fonts/Supplemental/ヒラギノ角ゴシック W4.ttc::0',
    '/Library/Fonts/NotoSansCJKjp-Regular.otf',
    'C:\\Windows\\Fonts\\YuGothR.ttc::0',
    'C:\\Windows\\Fonts\\meiryo.ttc::0',
    'C:\\Windows\\Fonts\\msgothic.ttc::0',
  ]);

  pushCandidates(mediumCandidates, [
    '/usr/share/fonts/opentype/noto/NotoSansCJKjp-Medium.otf',
    '/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc::1',
    '/System/Library/Fonts/Supplemental/ヒラギノ角ゴシック W6.ttc::0',
    '/Library/Fonts/NotoSansCJKjp-Medium.otf',
    'C:\\Windows\\Fonts\\YuGothM.ttc::0',
  ]);

  pushCandidates(boldCandidates, [
    '/usr/share/fonts/opentype/noto/NotoSansCJKjp-Bold.otf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc::0',
    '/System/Library/Fonts/Supplemental/ヒラギノ角ゴシック W8.ttc::0',
    '/Library/Fonts/NotoSansCJKjp-Bold.otf',
    'C:\\Windows\\Fonts\\YuGothB.ttc::0',
    'C:\\Windows\\Fonts\\meiryob.ttc::0',
  ]);

  const regular = findExistingFont(regularCandidates);
  const medium = findExistingFont(mediumCandidates);
  const bold = findExistingFont(boldCandidates);

  const fontEntries: Array<{ src: string; fontWeight: number; fontIndex?: number; postscriptName?: string }> = [];

  if (regular) {
    fontEntries.push({
      src: regular.path,
      fontWeight: 400,
      fontIndex: regular.fontIndex,
      postscriptName: regular.postscriptName,
    });
  }

  if (medium) {
    fontEntries.push({
      src: medium.path,
      fontWeight: 600,
      fontIndex: medium.fontIndex,
      postscriptName: medium.postscriptName,
    });
  } else if (regular) {
    fontEntries.push({
      src: regular.path,
      fontWeight: 600,
      fontIndex: regular.fontIndex,
      postscriptName: regular.postscriptName,
    });
  }

  if (bold) {
    fontEntries.push({
      src: bold.path,
      fontWeight: 700,
      fontIndex: bold.fontIndex,
      postscriptName: bold.postscriptName,
    });
  } else if (medium) {
    fontEntries.push({
      src: medium.path,
      fontWeight: 700,
      fontIndex: medium.fontIndex,
      postscriptName: medium.postscriptName,
    });
  } else if (regular) {
    fontEntries.push({
      src: regular.path,
      fontWeight: 700,
      fontIndex: regular.fontIndex,
      postscriptName: regular.postscriptName,
    });
  }

  if (fontEntries.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[pdf] No Japanese font files found. Falling back to Helvetica for PDF rendering.');
    }
    return;
  }

  try {
    Font.register({
      family: JAPANESE_FONT_FAMILY,
      fonts: fontEntries.map((entry) => ({
        src: entry.src,
        fontWeight: entry.fontWeight,
        fontStyle: 'normal',
        ...(entry.fontIndex !== undefined ? { fontIndex: entry.fontIndex } : {}),
        ...(entry.postscriptName ? { postscriptName: entry.postscriptName } : {}),
      })) as any,
    });
    japaneseFontAvailable = true;
  } catch (error) {
    console.warn('[pdf] Failed to register Japanese font family:', error);
  }
}

function contentContainsJapanese(content: ResumeDraftContent): boolean {
  const stack: unknown[] = [content];

  while (stack.length > 0) {
    const value = stack.pop();

    if (typeof value === 'string') {
      if (japaneseCharacterPattern.test(value)) {
        return true;
      }
    } else if (Array.isArray(value)) {
      stack.push(...value);
    } else if (value && typeof value === 'object') {
      stack.push(...Object.values(value as Record<string, unknown>));
    }
  }

  return false;
}

type FontPreference = {
  preferJapanese?: boolean;
  style?: 'sans' | 'serif';
};

function getFontFamily(content: ResumeDraftContent, options?: FontPreference) {
  ensurePdfFontsRegistered();

  if (
    japaneseFontAvailable &&
    (options?.preferJapanese || content.language?.toLowerCase().startsWith('ja') || contentContainsJapanese(content))
  ) {
    return JAPANESE_FONT_FAMILY;
  }

  if (options?.style === 'serif') {
    return 'Times-Roman';
  }

  return DEFAULT_FONT_FAMILY;
}
import {
  firstEducation,
  formatDateRange,
  groupExperiencesByCategory,
} from '@/templates/resume/components/shared';

// Google-hosted font files were previously registered here, but external downloads
// can fail in restricted or offline environments. Using the built-in Helvetica font
// ensures PDF generation works reliably without remote dependencies.
const baseStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1f2937',
    padding: 36,
    lineHeight: 1.4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    color: '#0f172a',
  },
  bulletList: {
    marginLeft: 12,
    marginTop: 4,
    display: 'flex',
    flexDirection: 'column',
  },
  bulletItem: {
    marginBottom: 2,
  },
});

const ariaStyles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 48,
  },
  header: {
    marginBottom: 28,
  },
  name: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 1.6,
  },
  role: {
    fontSize: 20,
    fontWeight: 600,
    color: '#475569',
    marginTop: 6,
  },
  summary: {
    marginTop: 14,
    color: '#1f2937',
    fontSize: 12,
    lineHeight: 1.6,
  },
  contact: {
    marginTop: 14,
    fontSize: 10.5,
    color: '#0f172a',
    fontWeight: 600,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#0f172a',
    marginBottom: 12,
  },
  experienceBlock: {
    marginBottom: 18,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  experienceCompany: {
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
  },
  experienceDates: {
    fontSize: 10.5,
    fontWeight: 600,
    color: '#94a3b8',
  },
  bulletList: {
    marginTop: 12,
    marginLeft: 16,
  },
  bulletItem: {
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    fontSize: 11,
    fontWeight: 600,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  educationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  educationSchool: {
    fontSize: 16,
    fontWeight: 700,
  },
  educationDegree: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 600,
    marginTop: 2,
  },
  educationDates: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 600,
  },
});

const sashaStyles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 24,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#0f172a',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  sidebar: {
    width: 226,
    backgroundColor: '#10172a',
    color: '#f8fafc',
    paddingVertical: 48,
    paddingHorizontal: 36,
    justifyContent: 'flex-start',
  },
  sidebarHeading: {
    fontSize: 30,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  sidebarRole: {
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    marginTop: 12,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 4.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sidebarList: {
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarListItem: {
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sidebarContact: {
    marginTop: 20,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 1.6,
  },
  main: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 56,
    paddingHorizontal: 60,
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeading: {
    fontSize: 14,
    letterSpacing: 4.8,
    textTransform: 'uppercase',
    color: '#0f172a',
    fontWeight: 600,
    marginBottom: 16,
  },
  experience: {
    marginBottom: 20,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  experienceTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
  },
  experienceCompany: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 600,
  },
  experienceDates: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 600,
    marginTop: 6,
  },
  bulletList: {
    marginTop: 10,
    marginLeft: 14,
    display: 'flex',
    flexDirection: 'column',
  },
  bulletText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#1e293b',
    marginBottom: 6,
  },
  skillChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  skillChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginHorizontal: 6,
    marginBottom: 10,
  },
});

const samanthaStyles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  container: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingVertical: 40,
    paddingHorizontal: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  headerName: {
    fontSize: 30,
    fontWeight: 700,
  },
  headerRole: {
    fontSize: 18,
    color: '#e2e8f0',
  },
  headerContact: {
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 1.6,
  },
  summary: {
    marginTop: 18,
    fontSize: 12,
    lineHeight: 1.7,
    color: '#e2e8f0',
  },
  body: {
    paddingVertical: 40,
    paddingHorizontal: 48,
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeading: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: 700,
    marginBottom: 16,
  },
  experience: {
    marginBottom: 24,
  },
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  experienceCompany: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 600,
  },
  experienceDates: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 600,
    marginTop: 6,
  },
  bulletList: {
    marginTop: 10,
    marginLeft: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  bulletText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.6,
    marginBottom: 6,
  },
  educationEntry: {
    marginBottom: 18,
  },
  educationSchool: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  educationDegree: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 600,
    marginTop: 2,
  },
  educationDates: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 600,
    marginRight: 12,
    marginBottom: 12,
  },
  certificateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  certificateName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 6,
  },
  certificateDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  list: {
    marginLeft: 16,
    display: 'flex',
    flexDirection: 'column',
  },
});

const catherineStyles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 28,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  sidebar: {
    width: 236,
    backgroundColor: '#1f2937',
    color: '#f8fafc',
    paddingVertical: 48,
    paddingHorizontal: 40,
  },
  sidebarName: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f8fafc',
  },
  sidebarRole: {
    fontSize: 15,
    color: '#e5e7eb',
    marginTop: 8,
  },
  sidebarContact: {
    marginTop: 18,
    fontSize: 12,
    lineHeight: 1.6,
  },
  sidebarHeading: {
    marginTop: 24,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 4.8,
  },
  sidebarList: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarListItem: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  main: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 56,
    paddingHorizontal: 64,
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 20,
    color: '#1f2937',
    fontWeight: 700,
    marginBottom: 16,
  },
  paragraph: {
    color: '#4b5563',
    fontSize: 12,
    lineHeight: 1.7,
  },
  experience: {
    marginBottom: 26,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1f2937',
  },
  experienceCompany: {
    fontSize: 12,
    fontWeight: 600,
    color: '#4b5563',
  },
  experienceLocation: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  experienceDates: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 600,
    marginTop: 6,
  },
  bulletList: {
    marginTop: 12,
    marginLeft: 18,
    display: 'flex',
    flexDirection: 'column',
  },
  bulletText: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 1.7,
    marginBottom: 6,
  },
  educationEntry: {
    marginBottom: 18,
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1f2937',
  },
  educationSchool: {
    fontSize: 13,
    fontWeight: 600,
    color: '#4b5563',
    marginTop: 2,
  },
  educationDates: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  skillChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: 600,
    marginRight: 12,
    marginBottom: 12,
  },
  certificateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  certificateName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 6,
  },
  certificateDate: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
  },
});

function getListSection(content: ResumeDraftContent, id: string) {
  return content.listSections.find((section) => section.id === id);
}

function getListItem(content: ResumeDraftContent, id: string, index: number, fallback = '') {
  return getListSection(content, id)?.items[index] ?? fallback;
}

function parseYearMonth(value?: string): [string, string] {
  if (!value) return ['', ''];
  if (value.includes('-')) {
    const [year, month] = value.split('-');
    return [year ?? '', month?.padStart(2, '0') ?? ''];
  }
  const numeric = value.match(/(\d{4})[^0-9]*(\d{1,2})?/);
  if (numeric) {
    return [numeric[1] ?? '', numeric[2] ? numeric[2].padStart(2, '0') : ''];
  }
  return [value, ''];
}

function getDefaultDateParts(): [string, string, string] {
  const now = new Date();
  return [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ];
}

function parseYearMonthDay(value?: string): [string, string, string] {
  if (!value) {
    return ['', '', ''];
  }

  if (value.includes('-')) {
    const [year, month, day] = value.split('-');
    return [year ?? '', month?.padStart(2, '0') ?? '', day?.padStart(2, '0') ?? ''];
  }

  const numeric = value.match(/(\d{4})[^0-9]*(\d{1,2})[^0-9]*(\d{1,2})?/);
  if (numeric) {
    return [
      numeric[1] ?? '',
      numeric[2] ? numeric[2].padStart(2, '0') : '',
      numeric[3] ? numeric[3].padStart(2, '0') : '',
    ];
  }

  return [value, '', ''];
}

const japaneseBorderColor = '#d1d5db';
const japaneseSubtleFill = '#f8fafc';

const japaneseStyles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: japaneseBorderColor,
    padding: 24,
    backgroundColor: '#ffffff',
  },
  section: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    marginRight: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  headerRight: {
    width: 160,
    alignItems: 'flex-end',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 4,
  },
  photoBox: {
    width: 140,
    height: 180,
    borderWidth: 1,
    borderColor: japaneseBorderColor,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    color: '#6b7280',
    fontSize: 12,
  },
  nameGrid: {
    borderWidth: 1,
    borderColor: japaneseBorderColor,
    marginTop: 16,
  },
  applicationDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  dateBox: {
    width: 48,
    height: 28,
    borderWidth: 1,
    borderColor: japaneseBorderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: japaneseBorderColor,
  },
  gridLabel: {
    width: 100,
    borderRightWidth: 1,
    borderRightColor: japaneseBorderColor,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: japaneseSubtleFill,
    paddingVertical: 8,
    fontSize: 10,
  },
  gridValue: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  furiganaText: {
    fontSize: 12,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 700,
  },
  table: {
    borderWidth: 1,
    borderColor: japaneseBorderColor,
  },
  tableHeading: {
    borderBottomWidth: 1,
    borderBottomColor: japaneseBorderColor,
    backgroundColor: japaneseSubtleFill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    letterSpacing: 1,
  },
  tableHeadingText: {
    fontSize: 12,
    fontWeight: 700,
  },
  historyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: japaneseBorderColor,
  },
  historyYear: {
    width: 56,
    borderRightWidth: 1,
    borderRightColor: japaneseBorderColor,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  historyMonth: {
    width: 56,
    borderRightWidth: 1,
    borderRightColor: japaneseBorderColor,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  historyDescription: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  historyLabelText: {
    fontSize: 11,
  },
  historyDescriptionText: {
    fontSize: 11,
  },
  multiLine: {
    minHeight: 90,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  multiLineText: {
    fontSize: 11,
    lineHeight: 1.6,
  },
  dualCellRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: japaneseBorderColor,
  },
  dualCell: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  dualCellText: {
    fontSize: 11,
  },
});

const turnerStyles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    padding: 24,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 1.6,
    color: '#0f172a',
  },
  role: {
    fontSize: 14,
    fontWeight: 600,
    color: '#2563eb',
    marginTop: 4,
  },
  tagline: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#64748b',
    marginTop: 4,
  },
  contact: {
    fontSize: 10,
    color: '#1f2937',
    textAlign: 'right',
  },
  divider: {
    height: 2,
    backgroundColor: '#e2e8f0',
    marginVertical: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#0f172a',
    fontWeight: 700,
    marginBottom: 8,
  },
  twoColumn: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  columnSpacing: {
    marginRight: 18,
  },
  listItem: {
    fontSize: 10.5,
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 1.45,
  },
  educationItem: {
    marginBottom: 12,
  },
  educationSchool: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0f172a',
  },
  educationDegree: {
    fontSize: 11,
    color: '#1f2937',
  },
  educationDates: {
    fontSize: 10,
    color: '#94a3b8',
  },
  experience: {
    marginBottom: 16,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  experienceTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0f172a',
  },
  experienceDates: {
    fontSize: 10,
    color: '#64748b',
  },
  experienceCompany: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 2,
  },
  experienceLocation: {
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  bullet: {
    fontSize: 10.5,
    color: '#1f2937',
    marginTop: 4,
    lineHeight: 1.4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10.5,
    color: '#1f2937',
    lineHeight: 1.5,
  },
  simpleList: {
    fontSize: 10.5,
    color: '#1f2937',
    marginBottom: 6,
  },
  pageFooter: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'right',
  },
});

function ariaPdf(content: ResumeDraftContent) {
  const grouped = groupExperiencesByCategory(content.workExperiences);
  const primarySkills =
    content.skillGroups.find((group) => group.placement !== 'sidebar')?.skills ??
    content.skillGroups[0]?.skills ??
    [];
  const education = firstEducation(content.education);
  const contactValues = [
    content.profile.contact.email,
    content.profile.contact.phone,
    content.profile.contact.location,
    content.profile.contact.website,
  ].filter(Boolean);

  return (
    <Document>
      <Page
        size="A4"
        style={{ ...baseStyles.page, padding: 0, backgroundColor: '#f1f5f9', fontFamily: getFontFamily(content) }}
      >
        <View style={ariaStyles.background}>
          <View style={ariaStyles.card}>
            <View style={ariaStyles.header}>
              <Text style={ariaStyles.name}>{content.profile.fullName.toUpperCase()}</Text>
              {content.profile.role ? <Text style={ariaStyles.role}>{content.profile.role}</Text> : null}
              {content.summary ? <Text style={ariaStyles.summary}>{content.summary}</Text> : null}
              {contactValues.length > 0 ? (
                <Text style={ariaStyles.contact}>{contactValues.join('  •  ')}</Text>
              ) : null}
            </View>

            {Object.entries(grouped).map(([category, experiences]) => (
              <View key={category} style={ariaStyles.section}>
                <Text style={ariaStyles.sectionTitle}>{category.toUpperCase()}</Text>
                {experiences.map((experience) => (
                  <View key={experience.id} style={ariaStyles.experienceBlock}>
                    <View style={ariaStyles.experienceHeader}>
                      <View>
                        <Text style={ariaStyles.experienceTitle}>{experience.title}</Text>
                        {experience.company ? (
                          <Text style={ariaStyles.experienceCompany}>{experience.company}</Text>
                        ) : null}
                      </View>
                      {formatDateRange(experience.startDate, experience.endDate) ? (
                        <Text style={ariaStyles.experienceDates}>
                          {formatDateRange(experience.startDate, experience.endDate)}
                        </Text>
                      ) : null}
                    </View>
                    {experience.location ? (
                      <Text style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{experience.location}</Text>
                    ) : null}
                    {experience.bullets.length > 0 ? (
                      <View style={ariaStyles.bulletList}>
                        {experience.bullets.map((bullet, index) => (
                          <Text key={`${experience.id}-bullet-${index}`} style={ariaStyles.bulletItem}>
                            • {bullet}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}

            {primarySkills.length > 0 ? (
              <View style={ariaStyles.section}>
                <Text style={ariaStyles.sectionTitle}>Core Skills</Text>
                <View style={ariaStyles.chipRow}>
                  {primarySkills.map((skill) => (
                    <Text key={skill} style={ariaStyles.chip}>
                      {skill}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}

            {education ? (
              <View style={ariaStyles.section}>
                <Text style={ariaStyles.sectionTitle}>Education</Text>
                <View style={ariaStyles.educationRow}>
                  <View>
                    <Text style={ariaStyles.educationSchool}>{education.school}</Text>
                    {education.degree ? <Text style={ariaStyles.educationDegree}>{education.degree}</Text> : null}
                  </View>
                  {formatDateRange(education.startDate, education.endDate) ? (
                    <Text style={ariaStyles.educationDates}>
                      {formatDateRange(education.startDate, education.endDate)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}


function sashaPdf(content: ResumeDraftContent) {
  const sidebarSkills = content.skillGroups.filter((group) => group.placement !== 'main');
  const mainSkills = content.skillGroups.filter((group) => group.placement === 'main');
  const sidebarSections = content.listSections.filter((section) => section.placement !== 'main');

  return (
    <Document>
      <Page
        size="A4"
        style={{
          ...baseStyles.page,
          padding: 0,
          fontFamily: getFontFamily(content, { style: 'serif' }),
          backgroundColor: '#f1f5f9',
        }}
      >
        <View style={sashaStyles.background}>
          <View style={sashaStyles.container}>
            <View style={sashaStyles.sidebar}>
              <Text style={sashaStyles.sidebarHeading}>{content.profile.fullName.toUpperCase()}</Text>
              {content.profile.role ? (
                <Text style={sashaStyles.sidebarRole}>{content.profile.role.toUpperCase()}</Text>
              ) : null}

              <View style={sashaStyles.sidebarContact}>
                {[content.profile.contact.email, content.profile.contact.phone, content.profile.contact.location, content.profile.contact.linkedin, content.profile.contact.website]
                  .filter(Boolean)
                  .map((value) => (
                    <Text key={value} style={sashaStyles.sidebarListItem}>
                      {value}
                    </Text>
                  ))}
              </View>

              {content.education.length > 0 ? (
                <View style={{ marginTop: 32 }}>
                  <Text style={sashaStyles.sidebarSectionTitle}>Education</Text>
                  {content.education.map((entry) => (
                    <View key={entry.id} style={{ marginBottom: 14 }}>
                      {entry.degree ? (
                        <Text style={sashaStyles.sidebarListItem}>{entry.degree}</Text>
                      ) : null}
                      <Text style={sashaStyles.sidebarListItem}>{entry.school}</Text>
                      <Text style={[sashaStyles.sidebarListItem, { opacity: 0.8 }]}>
                        {formatDateRange(entry.startDate, entry.endDate)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {sidebarSections.map((section) => (
                <View key={section.id} style={{ marginTop: 28 }}>
                  <Text style={sashaStyles.sidebarSectionTitle}>{section.title.toUpperCase()}</Text>
                  <View style={sashaStyles.sidebarList}>
                    {section.items.map((item) => (
                      <Text key={item} style={sashaStyles.sidebarListItem}>
                        {item}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}

              {sidebarSkills.map((group) => (
                <View key={group.id} style={{ marginTop: 28 }}>
                  <Text style={sashaStyles.sidebarSectionTitle}>{group.title.toUpperCase()}</Text>
                  <View style={sashaStyles.sidebarList}>
                    {group.skills.map((skill) => (
                      <Text key={skill} style={sashaStyles.sidebarListItem}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View style={sashaStyles.main}>
              {content.objective ? (
                <View style={sashaStyles.section}>
                  <Text style={sashaStyles.sectionHeading}>Career Objective</Text>
                  <Text style={{ fontSize: 12, lineHeight: 1.6, color: '#1e293b' }}>{content.objective}</Text>
                </View>
              ) : null}

              {content.workExperiences.length > 0 ? (
                <View style={sashaStyles.section}>
                  <Text style={sashaStyles.sectionHeading}>Work Experience</Text>
                  {content.workExperiences.map((experience) => (
                    <View key={experience.id} style={sashaStyles.experience}>
                      <View style={sashaStyles.experienceHeader}>
                        <View>
                          <Text style={sashaStyles.experienceTitle}>{experience.title}</Text>
                          {experience.company ? (
                            <Text style={sashaStyles.experienceCompany}>{experience.company}</Text>
                          ) : null}
                        </View>
                        {formatDateRange(experience.startDate, experience.endDate) ? (
                          <Text style={sashaStyles.experienceDates}>
                            {formatDateRange(experience.startDate, experience.endDate)}
                          </Text>
                        ) : null}
                      </View>
                      {experience.location ? (
                        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{experience.location}</Text>
                      ) : null}
                      {experience.bullets.length > 0 ? (
                        <View style={sashaStyles.bulletList}>
                          {experience.bullets.map((bullet, index) => (
                            <Text key={`${experience.id}-bullet-${index}`} style={sashaStyles.bulletText}>
                              • {bullet}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {mainSkills.length > 0 ? (
                <View style={sashaStyles.section}>
                  <Text style={sashaStyles.sectionHeading}>Skills</Text>
                  <View style={sashaStyles.skillChipRow}>
                    {mainSkills.flatMap((group) => group.skills).map((skill) => (
                      <Text key={skill} style={sashaStyles.skillChip}>
                        {skill.toUpperCase()}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}



function samanthaPdf(content: ResumeDraftContent) {
  const skills = content.skillGroups.flatMap((group) => group.skills);
  const certificates = content.certifications;
  const listSections = content.listSections.filter((section) => section.placement !== 'sidebar');

  return (
    <Document>
      <Page
        size="A4"
        style={{ ...baseStyles.page, padding: 0, fontFamily: getFontFamily(content) }}
      >
        <View style={samanthaStyles.background}>
          <View style={samanthaStyles.container}>
            <View style={samanthaStyles.header}>
              <View style={samanthaStyles.headerRow}>
                <View>
                  <Text style={samanthaStyles.headerName}>{content.profile.fullName}</Text>
                  {content.profile.role ? (
                    <Text style={samanthaStyles.headerRole}>{content.profile.role}</Text>
                  ) : null}
                </View>
                <View style={samanthaStyles.headerContact}>
                  {[content.profile.contact.phone, content.profile.contact.email, content.profile.contact.location, content.profile.contact.linkedin]
                    .filter(Boolean)
                    .map((value) => (
                      <Text key={value}>{value}</Text>
                    ))}
                </View>
              </View>
              {content.summary ? <Text style={samanthaStyles.summary}>{content.summary}</Text> : null}
            </View>

            <View style={samanthaStyles.body}>
              {content.workExperiences.length > 0 ? (
                <View style={samanthaStyles.section}>
                  <Text style={samanthaStyles.sectionHeading}>Work History</Text>
                  {content.workExperiences.map((experience) => (
                    <View key={experience.id} style={samanthaStyles.experience}>
                      <View style={samanthaStyles.experienceRow}>
                        <View>
                          <Text style={samanthaStyles.experienceTitle}>{experience.title}</Text>
                          {experience.company ? (
                            <Text style={samanthaStyles.experienceCompany}>{experience.company}</Text>
                          ) : null}
                        </View>
                        {formatDateRange(experience.startDate, experience.endDate) ? (
                          <Text style={samanthaStyles.experienceDates}>
                            {formatDateRange(experience.startDate, experience.endDate)}
                          </Text>
                        ) : null}
                      </View>
                      {experience.bullets.length > 0 ? (
                        <View style={samanthaStyles.bulletList}>
                          {experience.bullets.map((bullet, index) => (
                            <Text key={`${experience.id}-bullet-${index}`} style={samanthaStyles.bulletText}>
                              • {bullet}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {content.education.length > 0 ? (
                <View style={samanthaStyles.section}>
                  <Text style={samanthaStyles.sectionHeading}>Education</Text>
                  {content.education.map((entry) => (
                    <View key={entry.id} style={samanthaStyles.educationEntry}>
                      <Text style={samanthaStyles.educationSchool}>{entry.school}</Text>
                      {entry.degree ? (
                        <Text style={samanthaStyles.educationDegree}>{entry.degree}</Text>
                      ) : null}
                      <Text style={samanthaStyles.educationDates}>{formatDateRange(entry.startDate, entry.endDate)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {skills.length > 0 ? (
                <View style={samanthaStyles.section}>
                  <Text style={samanthaStyles.sectionHeading}>Skills</Text>
                  <View style={samanthaStyles.skillRow}>
                    {skills.map((skill) => (
                      <Text key={skill} style={samanthaStyles.skillChip}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : null}

              {certificates.length > 0 ? (
                <View style={samanthaStyles.section}>
                  <Text style={samanthaStyles.sectionHeading}>Certificates</Text>
                  {certificates.map((certificate) => (
                    <View key={certificate.id} style={samanthaStyles.certificateRow}>
                      <Text style={samanthaStyles.certificateName}>{certificate.name}</Text>
                      {certificate.date ? (
                        <Text style={samanthaStyles.certificateDate}>{certificate.date}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {listSections.map((section) => (
                <View key={section.id} style={samanthaStyles.section}>
                  <Text style={samanthaStyles.sectionHeading}>{section.title}</Text>
                  <View style={samanthaStyles.list}>
                    {section.items.map((item) => (
                      <Text key={item} style={samanthaStyles.bulletText}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}



function catherinePdf(content: ResumeDraftContent) {
  const sidebarGroups = content.skillGroups.filter((group) => group.placement === 'sidebar');
  const mainSkills = content.skillGroups.filter((group) => group.placement !== 'sidebar');
  const sidebarSections = content.listSections.filter((section) => section.placement === 'sidebar');

  return (
    <Document>
      <Page
        size="A4"
        style={{ ...baseStyles.page, padding: 0, fontFamily: getFontFamily(content) }}
      >
        <View style={catherineStyles.background}>
          <View style={catherineStyles.container}>
            <View style={catherineStyles.sidebar}>
              <Text style={catherineStyles.sidebarName}>{content.profile.fullName}</Text>
              {content.profile.role ? (
                <Text style={catherineStyles.sidebarRole}>{content.profile.role}</Text>
              ) : null}
              <View style={catherineStyles.sidebarContact}>
                {[content.profile.contact.email, content.profile.contact.phone, content.profile.contact.location, content.profile.contact.website, content.profile.contact.linkedin]
                  .filter(Boolean)
                  .map((value) => (
                    <Text key={value} style={catherineStyles.sidebarListItem}>
                      {value}
                    </Text>
                  ))}
              </View>

              {sidebarGroups.map((group) => (
                <View key={group.id}>
                  <Text style={catherineStyles.sidebarHeading}>{group.title}</Text>
                  <View style={catherineStyles.sidebarList}>
                    {group.skills.map((skill) => (
                      <Text key={skill} style={catherineStyles.sidebarListItem}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}

              {sidebarSections.map((section) => (
                <View key={section.id}>
                  <Text style={catherineStyles.sidebarHeading}>{section.title}</Text>
                  <View style={catherineStyles.sidebarList}>
                    {section.items.map((item) => (
                      <Text key={item} style={catherineStyles.sidebarListItem}>
                        {item}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View style={catherineStyles.main}>
              {content.summary ? (
                <View style={catherineStyles.section}>
                  <Text style={catherineStyles.sectionHeading}>Profile</Text>
                  <Text style={catherineStyles.paragraph}>{content.summary}</Text>
                </View>
              ) : null}

              {content.workExperiences.length > 0 ? (
                <View style={catherineStyles.section}>
                  <Text style={catherineStyles.sectionHeading}>Work Experience</Text>
                  {content.workExperiences.map((experience) => (
                    <View key={experience.id} style={catherineStyles.experience}>
                      <View style={catherineStyles.experienceHeader}>
                        <View>
                          <Text style={catherineStyles.experienceTitle}>{experience.title}</Text>
                          {experience.company ? (
                            <Text style={catherineStyles.experienceCompany}>{experience.company}</Text>
                          ) : null}
                          {experience.location ? (
                            <Text style={catherineStyles.experienceLocation}>{experience.location}</Text>
                          ) : null}
                        </View>
                        {formatDateRange(experience.startDate, experience.endDate) ? (
                          <Text style={catherineStyles.experienceDates}>
                            {formatDateRange(experience.startDate, experience.endDate)}
                          </Text>
                        ) : null}
                      </View>
                      {experience.bullets.length > 0 ? (
                        <View style={catherineStyles.bulletList}>
                          {experience.bullets.map((bullet, index) => (
                            <Text key={`${experience.id}-bullet-${index}`} style={catherineStyles.bulletText}>
                              • {bullet}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {content.education.length > 0 ? (
                <View style={catherineStyles.section}>
                  <Text style={catherineStyles.sectionHeading}>Education</Text>
                  {content.education.map((entry) => (
                    <View key={entry.id} style={catherineStyles.educationEntry}>
                      {entry.degree ? (
                        <Text style={catherineStyles.educationDegree}>{entry.degree}</Text>
                      ) : null}
                      <Text style={catherineStyles.educationSchool}>{entry.school}</Text>
                      <Text style={catherineStyles.educationDates}>{formatDateRange(entry.startDate, entry.endDate)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {mainSkills.length > 0 ? (
                <View style={catherineStyles.section}>
                  <Text style={catherineStyles.sectionHeading}>Skills</Text>
                  <View style={catherineStyles.skillChipRow}>
                    {mainSkills.flatMap((group) => group.skills).map((skill) => (
                      <Text key={skill} style={catherineStyles.skillChip}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : null}

              {content.certifications.length > 0 ? (
                <View style={catherineStyles.section}>
                  <Text style={catherineStyles.sectionHeading}>Certifications</Text>
                  {content.certifications.map((certification) => (
                    <View key={certification.id} style={catherineStyles.certificateRow}>
                      <Text style={catherineStyles.certificateName}>{certification.name}</Text>
                      {certification.date ? (
                        <Text style={catherineStyles.certificateDate}>{certification.date}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}


const pdfRenderers: Record<string, (content: ResumeDraftContent) => JSX.Element> = {
  'aria-stark': ariaPdf,
  'sasha-wagner': sashaPdf,
  'samantha-carter': samanthaPdf,
  'catherine-barnett': catherinePdf,
  'turner-global-cv': turnerPdf,
  'japanese-rirekisho': japanesePdf,
};

export function renderResumePdf(templateId: string, content: ResumeDraftContent) {
  const renderer = pdfRenderers[templateId] ?? ariaPdf;
  return renderer(content);
}
