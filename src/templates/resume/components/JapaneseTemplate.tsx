import { TemplatePreviewProps } from './shared';

function getSection(content: TemplatePreviewProps['content'], id: string) {
  return content.listSections.find((section) => section.id === id);
}

function getItem(content: TemplatePreviewProps['content'], id: string, index: number, fallback = '') {
  return getSection(content, id)?.items[index] ?? fallback;
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

export function JapaneseTemplate({ content }: TemplatePreviewProps) {
  const [defaultYear, defaultMonth, defaultDay] = getDefaultDateParts();
  const [applicationYear, applicationMonth, applicationDay] = parseYearMonthDay(
    getItem(content, 'japanese-application-date', 0, `${defaultYear}-${defaultMonth}-${defaultDay}`)
  );
  const furigana = getItem(content, 'japanese-furigana', 0, 'やまだ たろう');
  const birth = getItem(content, 'japanese-personal', 0, '1995年4月12日生（満28歳）');
  const gender = getItem(content, 'japanese-personal', 1, '男');
  const commute = getItem(content, 'japanese-personal', 2, '通勤時間 45分');
  const addressLine = getItem(
    content,
    'japanese-address',
    0,
    '〒150-0002 東京都渋谷区渋谷1-2-3 サンプルマンション301号'
  );
  const nearestStation = getItem(content, 'japanese-address', 1, '最寄駅 代々木上原駅');
  const dependents = getItem(content, 'japanese-household', 0, '扶養家族（配偶者を除く） 1人');
  const spouse = getItem(content, 'japanese-household', 1, '配偶者 あり・扶養義務 あり');
  const emergency = getSection(content, 'japanese-emergency');
  const objective =
    content.objective ??
    getItem(
      content,
      'japanese-goal',
      0,
      '御社の製品開発に携わり、国内市場のシェア拡大に貢献したいと考えております。'
    );
  const selfPr =
    content.summary ??
    getItem(
      content,
      'japanese-selfpr',
      0,
      '前職では営業として年間120%の達成率を継続し、チームリーダーとして育成にも携わりました。積極的に課題を発見し行動する姿勢を評価いただいております。'
    );
  const hobbies = getSection(content, 'japanese-hobbies');
  const licenses = getSection(content, 'japanese-licenses');
  const remarks = getSection(content, 'japanese-remarks');

  const educationEntries = [...content.education].sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
  const experienceEntries = [...content.workExperiences].sort((a, b) =>
    (a.startDate ?? '').localeCompare(b.startDate ?? '')
  );

  const borderColor = '#d1d5db';
  const subtleFill = '#f8fafc';
  const tableBorder = `1px solid ${borderColor}`;

  const renderHistoryRow = (
    year: string,
    month: string,
    description: string,
    key: string
  ) => (
    <div
      key={key}
      style={{
        display: 'grid',
        gridTemplateColumns: '56px 56px 1fr',
        borderBottom: tableBorder,
        minHeight: '40px',
        fontSize: '12px',
      }}
    >
      <div
        style={{ borderRight: tableBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {year}
      </div>
      <div
        style={{ borderRight: tableBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {month}
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>{description}</div>
    </div>
  );

  const pageStyle = {
    width: '540px',
    minHeight: '760px',
    border: tableBorder,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    background: '#fff',
  };

  const sectionHeadingStyle = {
    borderBottom: tableBorder,
    padding: '8px 12px',
    fontWeight: 700,
    background: subtleFill,
    fontSize: '12px',
    letterSpacing: '0.08em',
  };

  return (
    <div
      style={{
        fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", system-ui, sans-serif',
        color: '#1f2937',
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        padding: '16px',
        background: '#f3f4f6',
      }}
    >
      <div style={pageStyle}>
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 160px',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.4em' }}>履歴書</div>
            <div
              style={{
                border: tableBorder,
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
              }}
            >
              <div
                style={{
                  borderRight: tableBorder,
                  padding: '8px',
                  background: subtleFill,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                ふりがな
              </div>
              <div style={{ padding: '8px 12px', fontSize: '13px' }}>{furigana}</div>
              <div
                style={{
                  borderTop: tableBorder,
                  borderRight: tableBorder,
                  padding: '8px',
                  background: subtleFill,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                氏名
              </div>
              <div style={{ padding: '10px 12px', fontSize: '18px', fontWeight: 700 }}>{content.profile.fullName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 56px auto 36px auto 36px auto',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
            >
              <span>（</span>
              <div style={{ border: tableBorder, width: '56px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {applicationYear}
              </div>
              <span>年</span>
              <div style={{ border: tableBorder, width: '36px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {applicationMonth}
              </div>
              <span>月</span>
              <div style={{ border: tableBorder, width: '36px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {applicationDay}
              </div>
              <span>日現在 ）</span>
            </div>
            <div
              style={{
                border: tableBorder,
                width: '140px',
                height: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
                color: '#6b7280',
                fontSize: '12px',
              }}
            >
              写真貼付
            </div>
          </div>
        </header>

        <div
          style={{
            border: tableBorder,
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            fontSize: '12px',
          }}
        >
          <div style={{ borderRight: tableBorder, background: subtleFill, padding: '12px' }}>生年月日</div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>{birth}</span>
            <span>性別 {gender}</span>
            <span>{commute}</span>
          </div>
          <div style={{ borderTop: tableBorder, borderRight: tableBorder, background: subtleFill, padding: '12px' }}>現住所</div>
          <div style={{ borderTop: tableBorder, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>{addressLine}</span>
            <span>{nearestStation}</span>
            {content.profile.contact.phone && <span>TEL {content.profile.contact.phone}</span>}
            {content.profile.contact.email && <span>E-mail {content.profile.contact.email}</span>}
          </div>
        </div>

        <div style={{ border: tableBorder }}>
          <div style={sectionHeadingStyle}>学歴・職歴</div>
          {educationEntries.map((education) => {
            const [year, month] = parseYearMonth(education.startDate);
            return renderHistoryRow(year, month, `${education.school} ${education.degree}`, education.id);
          })}
          <div
            style={{
              borderBottom: tableBorder,
              padding: '6px 12px',
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'right',
            }}
          >
            以上
          </div>
          {experienceEntries.map((experience) => {
            const [year, month] = parseYearMonth(experience.startDate);
            return renderHistoryRow(year, month, `${experience.company} ${experience.title}`, experience.id);
          })}
        </div>

        {licenses ? (
          <div style={{ border: tableBorder }}>
            <div style={sectionHeadingStyle}>免許・資格</div>
            {licenses.items.map((item, index) => {
              const [date, description] = item.split('|');
              const [year, month] = parseYearMonth(date);
              const descriptionText = (description ?? item).trim();
              return renderHistoryRow(year, month, descriptionText, `${licenses.id}-${index}`);
            })}
          </div>
        ) : null}

        <div style={{ border: tableBorder }}>
          <div style={sectionHeadingStyle}>本人希望欄</div>
          <div
            style={{ minHeight: '88px', padding: '12px 16px', lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '12px' }}
          >
            {remarks?.items.join('\n') ?? '特記事項なし'}
          </div>
        </div>
      </div>

      <div style={pageStyle}>
        <div style={{ border: tableBorder }}>
          <div style={sectionHeadingStyle}>志望動機</div>
          <div style={{ minHeight: '120px', padding: '12px 16px', lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '12px' }}>
            {objective}
          </div>
        </div>

        <div style={{ border: tableBorder }}>
          <div style={sectionHeadingStyle}>自己PR</div>
          <div style={{ minHeight: '120px', padding: '12px 16px', lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '12px' }}>{selfPr}</div>
        </div>

        {hobbies ? (
          <div style={{ border: tableBorder }}>
            <div style={sectionHeadingStyle}>趣味・特技</div>
            <div style={{ padding: '12px 16px', fontSize: '12px', lineHeight: 1.6 }}>
              {hobbies.items.map((item) => (
                <div key={item}>・{item}</div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ border: tableBorder }}>
          <div style={sectionHeadingStyle}>通勤・家族状況</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '96px', fontSize: '12px' }}>
            <div style={{ borderRight: tableBorder, padding: '12px 16px', display: 'flex', alignItems: 'center' }}>{dependents}</div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center' }}>{spouse}</div>
          </div>
        </div>

        {emergency ? (
          <div style={{ border: tableBorder }}>
            <div style={sectionHeadingStyle}>緊急連絡先</div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              {emergency.items.map((item, index) => (
                <span key={`${emergency.id}-${index}`}>{item}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
