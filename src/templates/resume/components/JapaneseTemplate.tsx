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

export function JapaneseTemplate({ content }: TemplatePreviewProps) {
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

  const tableBorder = '1px solid #d97766';

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
        minHeight: '44px',
      }}
    >
      <div style={{ borderRight: tableBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{year}</div>
      <div style={{ borderRight: tableBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{month}</div>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>{description}</div>
    </div>
  );

  return (
    <div
      style={{
        fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", system-ui, sans-serif',
        color: '#1f2937',
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '540px',
          minHeight: '760px',
          border: tableBorder,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#fff',
        }}
      >
        <header style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '16px', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 700, letterSpacing: '0.08em' }}>履歴書</div>
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>RIREKISHO</div>
            <div
              style={{
                border: tableBorder,
                marginTop: '12px',
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                minHeight: '96px',
              }}
            >
              <div
                style={{
                  borderRight: tableBorder,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fef2f2',
                  fontSize: '12px',
                }}
              >
                ふりがな
              </div>
              <div style={{ padding: '8px 12px', fontSize: '14px' }}>{furigana}</div>
              <div
                style={{
                  borderTop: tableBorder,
                  borderRight: tableBorder,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fef2f2',
                  fontSize: '12px',
                }}
              >
                氏名
              </div>
              <div style={{ padding: '8px 12px', fontSize: '18px', fontWeight: 700 }}>{content.profile.fullName}</div>
            </div>
          </div>
          <div
            style={{
              border: tableBorder,
              height: '160px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #fde68a, #fff)',
              color: '#d97706',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            写真貼付
          </div>
        </header>

        <div
          style={{
            border: tableBorder,
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
          }}
        >
          <div style={{ borderRight: tableBorder, background: '#fef2f2', padding: '12px', fontSize: '12px' }}>生年月日</div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <span>{birth}</span>
            <span>性別 {gender}</span>
            <span>{commute}</span>
          </div>
          <div style={{ borderTop: tableBorder, borderRight: tableBorder, background: '#fef2f2', padding: '12px', fontSize: '12px' }}>
            住所
          </div>
          <div style={{ borderTop: tableBorder, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>{addressLine}</span>
            <span>{nearestStation}</span>
            {content.profile.contact.phone && <span>電話 {content.profile.contact.phone}</span>}
            {content.profile.contact.email && <span>メール {content.profile.contact.email}</span>}
          </div>
        </div>

        <div style={{ border: tableBorder }}>
          <div
            style={{
              borderBottom: tableBorder,
              padding: '8px 12px',
              fontWeight: 700,
              background: '#fef2f2',
            }}
          >
            学歴・職歴
          </div>
          {educationEntries.map((education) => {
            const [year, month] = parseYearMonth(education.startDate);
            return renderHistoryRow(year, month, `${education.school} ${education.degree}`, education.id);
          })}
          <div style={{ borderBottom: tableBorder, padding: '6px 12px', fontSize: '12px', color: '#ef4444' }}>以上</div>
          {experienceEntries.map((experience) => {
            const [year, month] = parseYearMonth(experience.startDate);
            return renderHistoryRow(year, month, `${experience.company} ${experience.title}`, experience.id);
          })}
        </div>

        {licenses ? (
          <div style={{ border: tableBorder }}>
            <div style={{ borderBottom: tableBorder, padding: '8px 12px', fontWeight: 700, background: '#fef2f2' }}>免許・資格</div>
            {licenses.items.map((item, index) => {
              const [date, description] = item.split('|');
              const [year, month] = parseYearMonth(date);
              const descriptionText = (description ?? item).trim();
              return renderHistoryRow(year, month, descriptionText, `${licenses.id}-${index}`);
            })}
          </div>
        ) : null}

        <div style={{ border: tableBorder }}>
          <div style={{ borderBottom: tableBorder, padding: '8px 12px', fontWeight: 700, background: '#fef2f2' }}>本人希望欄</div>
          <div
            style={{ minHeight: '88px', padding: '12px 16px', lineHeight: 1.7, whiteSpace: 'pre-line' }}
          >
            {remarks?.items.join('\n') ?? '特記事項なし'}
          </div>
        </div>
      </div>

      <div
        style={{
          width: '540px',
          minHeight: '760px',
          border: tableBorder,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#fff',
        }}
      >
        <div style={{ border: tableBorder }}>
          <div style={{ borderBottom: tableBorder, padding: '8px 12px', fontWeight: 700, background: '#fef2f2' }}>志望動機</div>
          <div style={{ minHeight: '120px', padding: '12px 16px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{objective}</div>
        </div>

        <div style={{ border: tableBorder }}>
          <div style={{ borderBottom: tableBorder, padding: '8px 12px', fontWeight: 700, background: '#fef2f2' }}>自己PR</div>
          <div style={{ minHeight: '120px', padding: '12px 16px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{selfPr}</div>
        </div>

        {hobbies ? (
          <div style={{ border: tableBorder }}>
            <div style={{ borderBottom: tableBorder, padding: '8px 12px', fontWeight: 700, background: '#fef2f2' }}>趣味・特技</div>
            <div style={{ padding: '12px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {hobbies.items.map((item) => (
                <span
                  key={item}
                  style={{
                    border: '1px solid #fca5a5',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    background: '#fef2f2',
                    fontSize: '13px',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ border: tableBorder }}>
          <div style={{ borderBottom: tableBorder, padding: '8px 12px', fontWeight: 700, background: '#fef2f2' }}>通勤・家族状況</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '96px' }}>
            <div style={{ borderRight: tableBorder, padding: '12px 16px', display: 'flex', alignItems: 'center' }}>{dependents}</div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center' }}>{spouse}</div>
          </div>
        </div>

        {emergency ? (
          <div style={{ border: tableBorder }}>
            <div style={{ borderBottom: tableBorder, padding: '8px 12px', fontWeight: 700, background: '#fef2f2' }}>緊急連絡先</div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
