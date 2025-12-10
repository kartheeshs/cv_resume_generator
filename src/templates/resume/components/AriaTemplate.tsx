import { TemplatePreviewProps, formatDateRange, groupExperiencesByCategory, firstEducation } from './shared';

export function AriaTemplate({ content }: TemplatePreviewProps) {
  const education = firstEducation(content.education);
  const grouped = groupExperiencesByCategory(content.workExperiences);

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#1f2937',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '24px',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '0.1em' }}>{content.profile.fullName.toUpperCase()}</div>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#475569' }}>{content.profile.role}</div>
        <div style={{ color: '#64748b', maxWidth: '680px', lineHeight: 1.6 }}>{content.summary}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#0f172a', fontWeight: 600 }}>
          {content.profile.contact.email && <span>{content.profile.contact.email}</span>}
          {content.profile.contact.phone && <span>{content.profile.contact.phone}</span>}
          {content.profile.contact.location && <span>{content.profile.contact.location}</span>}
          {content.profile.contact.website && <span>{content.profile.contact.website}</span>}
        </div>
      </header>

      {Object.entries(grouped).map(([section, experiences]) => (
        <section key={section}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {section}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {experiences.map((experience) => (
              <div key={experience.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{experience.title}</div>
                    <div style={{ color: '#475569', fontWeight: 500 }}>{experience.company}</div>
                  </div>
                  <div style={{ color: '#94a3b8', fontWeight: 600 }}>{formatDateRange(experience.startDate, experience.endDate)}</div>
                </div>
                <ul style={{ margin: '12px 0 0 20px', color: '#475569', lineHeight: 1.6 }}>
                  {experience.bullets.map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}

      {content.skillGroups.length > 0 && (
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Core Skills
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {(content.skillGroups.find((group) => group.placement !== 'sidebar') ?? content.skillGroups[0]).skills.map((skill) => (
              <span
                key={skill}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  background: '#e2e8f0',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {education && (
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Education
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{education.school}</div>
              <div style={{ color: '#475569', fontWeight: 500 }}>{education.degree}</div>
            </div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>{formatDateRange(education.startDate, education.endDate)}</div>
          </div>
        </section>
      )}
    </div>
  );
}
