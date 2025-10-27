import { CSSProperties, useId } from 'react';

interface CareerStudioLogoProps {
  variant?: 'stacked' | 'inline';
  showWordmark?: boolean;
  markSize?: number;
  style?: CSSProperties;
  wordmarkStyle?: CSSProperties;
}

export function CareerStudioLogo({
  variant = 'stacked',
  showWordmark = true,
  markSize = 40,
  style,
  wordmarkStyle,
}: CareerStudioLogoProps) {
  const gradientId = useId();
  const markStyle: CSSProperties = {
    width: `${markSize}px`,
    height: `${markSize}px`,
    borderRadius: markSize >= 40 ? '1.25rem' : '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, rgba(14,165,233,0.95) 0%, rgba(79,70,229,0.9) 55%, rgba(168,85,247,0.9) 100%)',
    boxShadow: '0 14px 34px -26px rgba(79, 70, 229, 0.85)',
    flex: '0 0 auto',
  };

  const wordmark = (() => {
    if (!showWordmark) return null;
    if (variant === 'inline') {
      return (
        <span
          style={{
            display: 'inline-flex',
            gap: '0.35rem',
            alignItems: 'baseline',
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: '#0f172a',
            ...wordmarkStyle,
          }}
        >
          <span>Career Studio</span>
          <span style={{ color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.16em', fontSize: '0.82em' }}>GM7</span>
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'grid',
          lineHeight: 1.1,
          color: '#0f172a',
          ...wordmarkStyle,
        }}
      >
        <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.01em' }}>Career Studio</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8', letterSpacing: '0.14em' }}>GM7</span>
      </span>
    );
  })();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        ...style,
      }}
    >
      <span aria-hidden style={markStyle}>
        <svg width={markSize * 0.55} height={markSize * 0.55} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={gradientId} x1="8" y1="10" x2="54" y2="54">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="55%" stopColor="#eef2ff" />
              <stop offset="100%" stopColor="#f5f3ff" />
            </linearGradient>
          </defs>
          <path
            d="M44 18h-9c-8.284 0-15 6.716-15 15s6.716 15 15 15c5.201 0 9.777-2.644 12.5-6.673"
            stroke={`url(#${gradientId})`}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 28l7 18 6.5-11 6.5 11L49 28"
            stroke="#f8fafc"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="4" fill="#bae6fd" />
        </svg>
      </span>
      {wordmark}
    </span>
  );
}
