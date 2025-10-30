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

function getFontFamily(content: ResumeDraftContent, options?: { preferJapanese?: boolean }) {
  ensurePdfFontsRegistered();

  if (
    japaneseFontAvailable &&
    (options?.preferJapanese || content.language?.toLowerCase().startsWith('ja') || contentContainsJapanese(content))
  ) {
    return JAPANESE_FONT_FAMILY;
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
    gap: 2,
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

function renderExperience(experience: ResumeDraftContent['workExperiences'][number]) {
  return (
    <View key={experience.id} style={{ marginBottom: 14 }}>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>{experience.title}</Text>
          <Text style={{ fontSize: 11, color: '#475569' }}>{experience.company}</Text>
        </View>
        <Text style={{ fontSize: 10, color: '#64748b' }}>
          {[experience.startDate, experience.endDate].filter(Boolean).join(' – ')}
        </Text>
      </View>
      {experience.location ? (
        <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{experience.location}</Text>
      ) : null}
      <View style={baseStyles.bulletList}>
        {experience.bullets.map((bullet, index) => (
          <Text key={index} style={baseStyles.bulletItem}>
            • {bullet}
          </Text>
        ))}
      </View>
    </View>
  );
}

function renderEducation(entry: ResumeDraftContent['education'][number]) {
  return (
    <View key={entry.id} style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 12, fontWeight: 700 }}>{entry.school}</Text>
      <Text style={{ fontSize: 11, color: '#475569' }}>{entry.degree}</Text>
      <Text style={{ fontSize: 10, color: '#64748b' }}>
        {[entry.startDate, entry.endDate].filter(Boolean).join(' – ')}
      </Text>
      {entry.location ? <Text style={{ fontSize: 10, color: '#94a3b8' }}>{entry.location}</Text> : null}
    </View>
  );
}

function renderList(items: string[]) {
  return (
    <View style={baseStyles.bulletList}>
      {items.map((item) => (
        <Text key={item} style={baseStyles.bulletItem}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

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
  return (
    <Document>
      <Page
        size="A4"
        style={{ ...baseStyles.page, padding: 0, fontFamily: getFontFamily(content) }}
      >
        <View style={{ flexDirection: 'row', height: '100%' }}>
          <View style={{ width: '32%', backgroundColor: '#0f172a', color: '#f8fafc', padding: 28 }}>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>{content.profile.fullName.toUpperCase()}</Text>
            <Text style={{ fontSize: 12, letterSpacing: 2, marginTop: 6 }}>{content.profile.role.toUpperCase()}</Text>
            <View style={{ marginTop: 14, fontSize: 10, lineHeight: 1.5 }}>
              {[content.profile.contact.email, content.profile.contact.phone, content.profile.contact.location, content.profile.contact.linkedin]
                .filter(Boolean)
                .map((value) => (
                  <Text key={value}>{value}</Text>
                ))}
            </View>
            {content.education.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>Education</Text>
                {content.education.map((entry) => (
                  <View key={entry.id} style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 10, fontWeight: 600 }}>{entry.degree}</Text>
                    <Text style={{ fontSize: 10 }}>{entry.school}</Text>
                    <Text style={{ fontSize: 9, opacity: 0.7 }}>
                      {[entry.startDate, entry.endDate].filter(Boolean).join(' – ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {content.listSections
              .filter((section) => section.placement !== 'main')
              .map((section) => (
                <View key={section.id} style={{ marginTop: 18 }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{section.title}</Text>
                  <View style={{ marginTop: 6 }}>{renderList(section.items)}</View>
                </View>
              ))}
            {content.skillGroups
              .filter((group) => group.placement !== 'main')
              .map((group) => (
                <View key={group.id} style={{ marginTop: 18 }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{group.title}</Text>
                  <View style={{ marginTop: 6 }}>{renderList(group.skills)}</View>
                </View>
              ))}
          </View>

          <View style={{ flex: 1, padding: 36 }}>
            {content.objective && (
              <View style={{ marginBottom: 16 }}>
                <Text style={baseStyles.sectionHeading}>Career Objective</Text>
                <Text>{content.objective}</Text>
              </View>
            )}
            <View style={{ marginBottom: 16 }}>
              <Text style={baseStyles.sectionHeading}>Work Experience</Text>
              {content.workExperiences.map((experience) => renderExperience(experience))}
            </View>
            {content.skillGroups.some((group) => group.placement === 'main') && (
              <View>
                <Text style={baseStyles.sectionHeading}>Skills</Text>
                {renderList(
                  content.skillGroups
                    .filter((group) => group.placement === 'main')
                    .flatMap((group) => group.skills)
                )}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

function samanthaPdf(content: ResumeDraftContent) {
  return (
    <Document>
      <Page
        size="A4"
        style={{ ...baseStyles.page, padding: 0, fontFamily: getFontFamily(content) }}
      >
        <View style={{ backgroundColor: '#0f172a', color: '#fff', padding: 32 }}>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: 700 }}>{content.profile.fullName}</Text>
              <Text style={{ fontSize: 12, opacity: 0.8 }}>{content.profile.role}</Text>
            </View>
            <View style={{ fontSize: 10, textAlign: 'right' }}>
              {[content.profile.contact.phone, content.profile.contact.email, content.profile.contact.location, content.profile.contact.linkedin]
                .filter(Boolean)
                .map((value) => (
                  <Text key={value}>{value}</Text>
                ))}
            </View>
          </View>
          {content.summary ? <Text style={{ marginTop: 12, fontSize: 11 }}>{content.summary}</Text> : null}
        </View>

        <View style={{ padding: 32, display: 'flex', gap: 16 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={baseStyles.sectionHeading}>Work History</Text>
            {content.workExperiences.map((experience) => renderExperience(experience))}
          </View>
          {content.education.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={baseStyles.sectionHeading}>Education</Text>
              {content.education.map((entry) => renderEducation(entry))}
            </View>
          )}
          {content.skillGroups.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={baseStyles.sectionHeading}>Skills</Text>
              {renderList(content.skillGroups.flatMap((group) => group.skills))}
            </View>
          )}
          {content.certifications.length > 0 && (
            <View>
              <Text style={baseStyles.sectionHeading}>Certificates</Text>
              <View style={baseStyles.bulletList}>
                {content.certifications.map((certificate) => (
                  <Text key={certificate.id} style={baseStyles.bulletItem}>
                    • {certificate.name} {certificate.date ? `(${certificate.date})` : ''}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

function japanesePdf(content: ResumeDraftContent) {
  const furigana = getListItem(content, 'japanese-furigana', 0, 'やまだ たろう');
  const birth = getListItem(content, 'japanese-personal', 0, '1995年4月12日生（満28歳）');
  const gender = getListItem(content, 'japanese-personal', 1, '男');
  const commute = getListItem(content, 'japanese-personal', 2, '通勤時間 45分');
  const address = getListSection(content, 'japanese-address');
  const dependents = getListItem(content, 'japanese-household', 0, '扶養家族（配偶者を除く） 1人');
  const spouse = getListItem(content, 'japanese-household', 1, '配偶者 あり・扶養義務 あり');
  const emergency = getListSection(content, 'japanese-emergency');
  const hobbies = getListSection(content, 'japanese-hobbies');
  const licenses = getListSection(content, 'japanese-licenses');
  const remarks = getListSection(content, 'japanese-remarks');

  const [defaultYear, defaultMonth, defaultDay] = getDefaultDateParts();
  const [applicationYear, applicationMonth, applicationDay] = parseYearMonthDay(
    getListItem(content, 'japanese-application-date', 0, `${defaultYear}-${defaultMonth}-${defaultDay}`)
  );

  const educationEntries = [...content.education].sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
  const experienceEntries = [...content.workExperiences].sort((a, b) =>
    (a.startDate ?? '').localeCompare(b.startDate ?? '')
  );

  const renderHistoryRow = (key: string, year: string, month: string, description: string) => (
    <View key={key} style={japaneseStyles.historyRow}>
      <View style={japaneseStyles.historyYear}>
        <Text style={japaneseStyles.historyLabelText}>{year}</Text>
      </View>
      <View style={japaneseStyles.historyMonth}>
        <Text style={japaneseStyles.historyLabelText}>{month}</Text>
      </View>
      <View style={japaneseStyles.historyDescription}>
        <Text style={japaneseStyles.historyDescriptionText}>{description}</Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page
        size="A4"
        style={{
          ...baseStyles.page,
          backgroundColor: '#fff',
          fontFamily: getFontFamily(content, { preferJapanese: true }),
        }}
      >
        <View style={japaneseStyles.container}>
          <View style={[japaneseStyles.section, japaneseStyles.header]}>
            <View style={japaneseStyles.headerLeft}>
              <Text style={japaneseStyles.title}>履歴書</Text>
              <View style={japaneseStyles.nameGrid}>
                <View style={[japaneseStyles.gridRow, { borderTopWidth: 0 }]}>
                  <View style={japaneseStyles.gridLabel}>
                    <Text>ふりがな</Text>
                  </View>
                  <View style={japaneseStyles.gridValue}>
                    <Text style={japaneseStyles.furiganaText}>{furigana}</Text>
                  </View>
                </View>
                <View style={japaneseStyles.gridRow}>
                  <View style={japaneseStyles.gridLabel}>
                    <Text>氏名</Text>
                  </View>
                  <View style={japaneseStyles.gridValue}>
                    <Text style={japaneseStyles.nameText}>{content.profile.fullName}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={japaneseStyles.headerRight}>
              <View style={japaneseStyles.applicationDateRow}>
                <Text style={{ fontSize: 10 }}>(</Text>
                <View style={[japaneseStyles.dateBox, { width: 56, height: 32, marginLeft: 4 }]}>
                  <Text style={{ fontSize: 11 }}>{applicationYear}</Text>
                </View>
                <Text style={{ fontSize: 10, marginLeft: 4 }}>年</Text>
                <View style={[japaneseStyles.dateBox, { width: 36, height: 32, marginLeft: 4 }]}>
                  <Text style={{ fontSize: 11 }}>{applicationMonth}</Text>
                </View>
                <Text style={{ fontSize: 10, marginLeft: 4 }}>月</Text>
                <View style={[japaneseStyles.dateBox, { width: 36, height: 32, marginLeft: 4 }]}>
                  <Text style={{ fontSize: 11 }}>{applicationDay}</Text>
                </View>
                <Text style={{ fontSize: 10, marginLeft: 4 }}>日現在 )</Text>
              </View>
              <View style={[japaneseStyles.photoBox, { marginTop: 12 }]}>
                <Text>写真貼付</Text>
              </View>
            </View>
          </View>

          <View style={[japaneseStyles.section, japaneseStyles.table]}>
            <View style={{ flexDirection: 'row' }}>
              <View style={[japaneseStyles.gridLabel, { height: 'auto', paddingVertical: 10 }]}>
                <Text>生年月日</Text>
              </View>
              <View style={[japaneseStyles.gridValue, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                <Text>{birth}</Text>
                <Text style={{ marginLeft: 12 }}>性別 {gender}</Text>
                <Text style={{ marginLeft: 12 }}>{commute}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: japaneseBorderColor }}>
              <View style={[japaneseStyles.gridLabel, { height: 'auto', paddingVertical: 10 }]}>
                <Text>現住所</Text>
              </View>
              <View style={[japaneseStyles.gridValue, { paddingVertical: 10 }]}>
                {address?.items.map((line) => (
                  <Text key={line}>{line}</Text>
                ))}
                {content.profile.contact.phone ? <Text>TEL {content.profile.contact.phone}</Text> : null}
                {content.profile.contact.email ? <Text>E-mail {content.profile.contact.email}</Text> : null}
              </View>
            </View>
          </View>

          <View style={[japaneseStyles.section, japaneseStyles.table]}>
            <View style={japaneseStyles.tableHeading}>
              <Text style={japaneseStyles.tableHeadingText}>学歴・職歴</Text>
            </View>
            {educationEntries.map((education) => {
              const [year, month] = parseYearMonth(education.startDate);
              return renderHistoryRow(education.id, year, month, `${education.school} ${education.degree}`);
            })}
            <View style={japaneseStyles.historyRow}>
              <View style={japaneseStyles.historyYear}>
                <Text style={japaneseStyles.historyLabelText}> </Text>
              </View>
              <View style={japaneseStyles.historyMonth}>
                <Text style={japaneseStyles.historyLabelText}> </Text>
              </View>
              <View style={japaneseStyles.historyDescription}>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    textAlign: 'right',
                    width: '100%',
                  }}
                >
                  以上
                </Text>
              </View>
            </View>
            {experienceEntries.map((experience) => {
              const [year, month] = parseYearMonth(experience.startDate);
              return renderHistoryRow(experience.id, year, month, `${experience.company} ${experience.title}`);
            })}
          </View>

          {licenses ? (
            <View style={[japaneseStyles.section, japaneseStyles.table]}>
            <View style={japaneseStyles.tableHeading}>
              <Text style={japaneseStyles.tableHeadingText}>免許・資格</Text>
            </View>
              {licenses.items.map((item, index) => {
                const [date, description] = item.split('|');
                const [year, month] = parseYearMonth(date);
                const descriptionText = (description ?? item).trim();
                return renderHistoryRow(`${licenses.id}-${index}`, year, month, descriptionText);
              })}
            </View>
          ) : null}

          <View style={[japaneseStyles.section, japaneseStyles.table]}>
            <View style={japaneseStyles.tableHeading}>
              <Text style={japaneseStyles.tableHeadingText}>本人希望欄</Text>
            </View>
            <View style={japaneseStyles.multiLine}>
              <Text style={japaneseStyles.multiLineText}>{(remarks?.items ?? ['特記事項なし']).join('\n')}</Text>
            </View>
          </View>
        </View>
      </Page>

      <Page size="A4" style={{ ...baseStyles.page, backgroundColor: '#fff' }}>
        <View style={japaneseStyles.container}>
          <View style={[japaneseStyles.section, japaneseStyles.table]}>
            <View style={japaneseStyles.tableHeading}>
              <Text style={japaneseStyles.tableHeadingText}>志望動機</Text>
            </View>
            <View style={japaneseStyles.multiLine}>
              <Text style={japaneseStyles.multiLineText}>
                {content.objective ?? '御社での業務に貢献できるよう尽力いたします。'}
              </Text>
            </View>
          </View>

          <View style={[japaneseStyles.section, japaneseStyles.table]}>
            <View style={japaneseStyles.tableHeading}>
              <Text style={japaneseStyles.tableHeadingText}>自己PR</Text>
            </View>
            <View style={japaneseStyles.multiLine}>
              <Text style={japaneseStyles.multiLineText}>
                {content.summary ?? '成果にこだわり行動する姿勢を強みにしています。'}
              </Text>
            </View>
          </View>

          {hobbies ? (
            <View style={[japaneseStyles.section, japaneseStyles.table]}>
              <View style={japaneseStyles.tableHeading}>
                <Text style={japaneseStyles.tableHeadingText}>趣味・特技</Text>
              </View>
              <View style={[japaneseStyles.multiLine, { rowGap: 4 }]}>
                {hobbies.items.map((item) => (
                  <Text key={item} style={{ fontSize: 11 }}>
                    ・{item}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          <View style={[japaneseStyles.section, japaneseStyles.table]}>
            <View style={japaneseStyles.tableHeading}>
              <Text style={japaneseStyles.tableHeadingText}>通勤・家族状況</Text>
            </View>
            <View style={japaneseStyles.dualCellRow}>
              <View style={[japaneseStyles.dualCell, { borderRightWidth: 1, borderRightColor: japaneseBorderColor }]}>
                <Text style={japaneseStyles.dualCellText}>{dependents}</Text>
              </View>
              <View style={japaneseStyles.dualCell}>
                <Text style={japaneseStyles.dualCellText}>{spouse}</Text>
              </View>
            </View>
          </View>

          {emergency ? (
            <View style={[japaneseStyles.section, japaneseStyles.table]}>
              <View style={japaneseStyles.tableHeading}>
                <Text style={japaneseStyles.tableHeadingText}>緊急連絡先</Text>
              </View>
              <View style={japaneseStyles.multiLine}>
                {emergency.items.map((item, index) => (
                  <Text key={`${emergency.id}-${index}`} style={japaneseStyles.multiLineText}>
                    {item}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

function turnerPdf(content: ResumeDraftContent) {
  const coursesLeft = getListSection(content, 'turner-courses-left')?.items ?? [
    'Immersive Cost Analytics (LSE)',
    'Financial Statement Analysis (UCSF)',
    'Advanced Excel for Financial Modeling',
    'Derivatives (Options Trading Institute)',
  ];
  const coursesRight = getListSection(content, 'turner-courses-right')?.items ?? [
    'Advanced Public Sector Financial Reporting and Analysis',
    'Corporate Finance',
    'Financial Risk Management (GARP)',
    'Portfolio Simulation Workshop',
  ];
  const achievementsLeft = getListSection(content, 'turner-achievements-left')?.items ?? [
    'Civic Service Awardee (2018) — Santa Monica Community',
    'Leadership Fellowship (2019) — Berkeley Haas Center',
  ];
  const achievementsRight = getListSection(content, 'turner-achievements-right')?.items ?? [
    'Peer Inc. Group of Companies Special Recognition (2017)',
    'Young Entrepreneur Summit Winner (2016)',
  ];
  const interests = getListSection(content, 'turner-interests')?.items ?? [
    'Machine Learning',
    'Calligraphy',
    'Astronomy',
    'Photography',
  ];
  const references = getListSection(content, 'turner-references')?.items ?? [];

  const volunteerExperiences = content.workExperiences.filter(
    (experience) => experience.category === 'Volunteer Experience'
  );
  const professionalExperiences = content.workExperiences.filter(
    (experience) => experience.category !== 'Volunteer Experience'
  );

  const languageGroup = content.skillGroups.find((group) => group.id === 'turner-languages');
  const certificationGroup = content.skillGroups.find((group) => group.id === 'turner-certifications');

  const renderExperience = (experience: ResumeDraftContent['workExperiences'][number]) => (
    <View key={experience.id} style={turnerStyles.experience}>
      <View style={turnerStyles.experienceHeader}>
        <Text style={turnerStyles.experienceTitle}>{experience.title}</Text>
        <Text style={turnerStyles.experienceDates}>
          {[experience.startDate, experience.endDate].filter(Boolean).join(' – ')}
        </Text>
      </View>
      <Text style={turnerStyles.experienceCompany}>{experience.company}</Text>
      {experience.location ? <Text style={turnerStyles.experienceLocation}>{experience.location}</Text> : null}
      {experience.bullets.map((bullet, index) => (
        <Text key={`${experience.id}-bullet-${index}`} style={turnerStyles.bullet}>
          • {bullet}
        </Text>
      ))}
    </View>
  );

  return (
    <Document>
      <Page
        size="A4"
        style={{
          ...baseStyles.page,
          fontFamily: getFontFamily(content),
          padding: 0,
          backgroundColor: '#e2e8f0',
        }}
      >
        <View style={turnerStyles.background}>
          <View style={turnerStyles.sheet}>
            <View style={turnerStyles.header}>
              <View>
                <Text style={turnerStyles.name}>{content.profile.fullName}</Text>
                <Text style={turnerStyles.role}>{content.profile.role}</Text>
                {content.profile.tagline ? (
                  <Text style={turnerStyles.tagline}>{content.profile.tagline}</Text>
                ) : null}
              </View>
              <View style={turnerStyles.contact}>
                {[content.profile.contact.phone, content.profile.contact.email, content.profile.contact.location, content.profile.contact.website]
                  .filter(Boolean)
                  .map((value) => (
                    <Text key={value}>{value}</Text>
                  ))}
              </View>
            </View>

            <View style={turnerStyles.divider} />

            <View style={turnerStyles.section}>
              <Text style={turnerStyles.sectionHeading}>Courses & Training</Text>
              <View style={turnerStyles.twoColumn}>
                <View style={[turnerStyles.column, turnerStyles.columnSpacing]}>
                  {coursesLeft.map((item, index) => (
                    <Text key={`course-left-${index}`} style={turnerStyles.listItem}>
                      {item}
                    </Text>
                  ))}
                </View>
                <View style={turnerStyles.column}>
                  {coursesRight.map((item, index) => (
                    <Text key={`course-right-${index}`} style={turnerStyles.listItem}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            <View style={turnerStyles.section}>
              <Text style={turnerStyles.sectionHeading}>Education</Text>
              {content.education.map((entry) => (
                <View key={entry.id} style={turnerStyles.educationItem}>
                  <Text style={turnerStyles.educationSchool}>{entry.school}</Text>
                  <Text style={turnerStyles.educationDegree}>{entry.degree}</Text>
                  <Text style={turnerStyles.educationDates}>
                    {[entry.startDate, entry.endDate].filter(Boolean).join(' – ')}
                  </Text>
                </View>
              ))}
            </View>

            <View style={turnerStyles.section}>
              <Text style={turnerStyles.sectionHeading}>Achievements & Awards</Text>
              <View style={turnerStyles.twoColumn}>
                <View style={[turnerStyles.column, turnerStyles.columnSpacing]}>
                  {achievementsLeft.map((item, index) => (
                    <Text key={`achievements-left-${index}`} style={turnerStyles.listItem}>
                      {item}
                    </Text>
                  ))}
                </View>
                <View style={turnerStyles.column}>
                  {achievementsRight.map((item, index) => (
                    <Text key={`achievements-right-${index}`} style={turnerStyles.listItem}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {volunteerExperiences.length > 0 ? (
              <View style={turnerStyles.section}>
                <Text style={turnerStyles.sectionHeading}>Volunteer Experience</Text>
                {volunteerExperiences.map((experience) => renderExperience(experience))}
              </View>
            ) : null}

            <View style={turnerStyles.section}>
              <Text style={turnerStyles.sectionHeading}>Interests & Hobbies</Text>
              <View style={turnerStyles.chipRow}>
                {interests.map((interest, index) => (
                  <Text key={`interest-${index}`} style={turnerStyles.chip}>
                    {interest}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Page>

      <Page
        size="A4"
        style={{
          ...baseStyles.page,
          fontFamily: getFontFamily(content),
          padding: 0,
          backgroundColor: '#e2e8f0',
        }}
      >
        <View style={turnerStyles.background}>
          <View style={turnerStyles.sheet}>
            <View style={turnerStyles.header}>
              <Text style={turnerStyles.name}>{content.profile.fullName}</Text>
              <Text style={turnerStyles.pageFooter}>Page 2 of 2</Text>
            </View>

            <View style={turnerStyles.divider} />

            {content.summary ? (
              <View style={turnerStyles.section}>
                <Text style={turnerStyles.sectionHeading}>Professional Summary</Text>
                <Text style={turnerStyles.paragraph}>{content.summary}</Text>
              </View>
            ) : null}

            {content.objective ? (
              <View style={turnerStyles.section}>
                <Text style={turnerStyles.sectionHeading}>Career Objective</Text>
                <Text style={turnerStyles.paragraph}>{content.objective}</Text>
              </View>
            ) : null}

            {professionalExperiences.length > 0 ? (
              <View style={turnerStyles.section}>
                <Text style={turnerStyles.sectionHeading}>Professional Experience</Text>
                {professionalExperiences.map((experience) => renderExperience(experience))}
              </View>
            ) : null}

            {languageGroup ? (
              <View style={turnerStyles.section}>
                <Text style={turnerStyles.sectionHeading}>{languageGroup.title}</Text>
                {languageGroup.skills.map((skill, index) => (
                  <Text key={`language-${index}`} style={turnerStyles.simpleList}>
                    {skill}
                  </Text>
                ))}
              </View>
            ) : null}

            {certificationGroup ? (
              <View style={turnerStyles.section}>
                <Text style={turnerStyles.sectionHeading}>{certificationGroup.title}</Text>
                {certificationGroup.skills.map((skill, index) => (
                  <Text key={`certification-${index}`} style={turnerStyles.simpleList}>
                    {skill}
                  </Text>
                ))}
              </View>
            ) : null}

            {content.certifications.length > 0 ? (
              <View style={turnerStyles.section}>
                <Text style={turnerStyles.sectionHeading}>Credentials</Text>
                {content.certifications.map((certificate) => (
                  <Text key={certificate.id} style={turnerStyles.simpleList}>
                    {certificate.name}
                    {certificate.date ? ` — ${certificate.date}` : ''}
                    {certificate.organization ? ` · ${certificate.organization}` : ''}
                  </Text>
                ))}
              </View>
            ) : null}

            {references.length > 0 ? (
              <View style={turnerStyles.section}>
                <Text style={turnerStyles.sectionHeading}>References</Text>
                {references.map((reference, index) => (
                  <Text key={`reference-${index}`} style={turnerStyles.simpleList}>
                    {reference}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

function catherinePdf(content: ResumeDraftContent) {
  return (
    <Document>
      <Page
        size="A4"
        style={{ ...baseStyles.page, padding: 0, fontFamily: getFontFamily(content) }}
      >
        <View style={{ flexDirection: 'row', height: '100%' }}>
          <View style={{ width: '35%', backgroundColor: '#1f2937', color: '#f8fafc', padding: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>{content.profile.fullName}</Text>
            <Text style={{ fontSize: 11, color: '#e5e7eb', marginTop: 6 }}>{content.profile.role}</Text>
            <View style={{ fontSize: 10, marginTop: 14 }}>
              {[content.profile.contact.email, content.profile.contact.phone, content.profile.contact.location, content.profile.contact.website, content.profile.contact.linkedin]
                .filter(Boolean)
                .map((value) => (
                  <Text key={value}>{value}</Text>
                ))}
            </View>
            {content.skillGroups
              .filter((group) => group.placement === 'sidebar')
              .map((group) => (
                <View key={group.id} style={{ marginTop: 18 }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{group.title}</Text>
                  <View style={{ marginTop: 6 }}>{renderList(group.skills)}</View>
                </View>
              ))}
            {content.listSections
              .filter((section) => section.placement === 'sidebar')
              .map((section) => (
                <View key={section.id} style={{ marginTop: 18 }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{section.title}</Text>
                  <View style={{ marginTop: 6 }}>{renderList(section.items)}</View>
                </View>
              ))}
          </View>

          <View style={{ flex: 1, padding: 36 }}>
            {content.summary && (
              <View style={{ marginBottom: 16 }}>
                <Text style={baseStyles.sectionHeading}>Profile</Text>
                <Text>{content.summary}</Text>
              </View>
            )}
            <View style={{ marginBottom: 16 }}>
              <Text style={baseStyles.sectionHeading}>Work Experience</Text>
              {content.workExperiences.map((experience) => renderExperience(experience))}
            </View>
            {content.education.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={baseStyles.sectionHeading}>Education</Text>
                {content.education.map((entry) => renderEducation(entry))}
              </View>
            )}
            {content.skillGroups.some((group) => group.placement !== 'sidebar') && (
              <View style={{ marginBottom: 16 }}>
                <Text style={baseStyles.sectionHeading}>Skills</Text>
                {renderList(
                  content.skillGroups
                    .filter((group) => group.placement !== 'sidebar')
                    .flatMap((group) => group.skills)
                )}
              </View>
            )}
            {content.certifications.length > 0 && (
              <View>
                <Text style={baseStyles.sectionHeading}>Certifications</Text>
                <View style={baseStyles.bulletList}>
                  {content.certifications.map((certificate) => (
                    <Text key={certificate.id} style={baseStyles.bulletItem}>
                      • {certificate.name} {certificate.date ? `(${certificate.date})` : ''}
                    </Text>
                  ))}
                </View>
              </View>
            )}
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
