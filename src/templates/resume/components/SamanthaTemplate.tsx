import { TemplatePreviewProps, formatDateRange } from './shared';

export function SamanthaTemplate({ content }: TemplatePreviewProps) {
  const skills = content.skillGroups.flatMap((group) => group.skills);
  const certificates = content.certifications;
  const listSections = content.listSections.filter((section) => section.placement !== 'sidebar');

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '32px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        maxWidth: '900px',
        margin: '0 auto',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.1)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <header style={{ background: '#0f172a', color: '#fff', padding: '36px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '30px', fontWeight: 700 }}>{content.profile.fullName}</div>
            <div style={{ fontSize: '18px', opacity: 0.8 }}>{content.profile.role}</div>
          </div>
          <div style={{ display: 'grid', gap: '6px', fontSize: '14px', textAlign: 'right' }}>
            {content.profile.contact.phone && <span>{content.profile.contact.phone}</span>}
            {content.profile.contact.email && <span>{content.profile.contact.email}</span>}
            {content.profile.contact.location && <span>{content.profile.contact.location}</span>}
            {content.profile.contact.linkedin && <span>{content.profile.contact.linkedin}</span>}
          </div>
        </div>
        {content.summary && <p style={{ marginTop: '20px', lineHeight: 1.7, fontSize: '15px' }}>{content.summary}</p>}
      </header>

      <main style={{ padding: '40px 48px', display: 'grid', gap: '32px' }}>
        {content.workExperiences.length > 0 && (
          <section>
            <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Work History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {content.workExperiences.map((experience) => (
                <article key={experience.id} style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>{experience.title}</div>
                      <div style={{ color: '#475569', fontWeight: 500 }}>{experience.company}</div>
                    </div>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>{formatDateRange(experience.startDate, experience.endDate)}</div>
                  </div>
                  <ul style={{ margin: '8px 0 0 18px', color: '#475569', lineHeight: 1.6 }}>
                    {experience.bullets.map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {content.education.length > 0 && (
          <section>
            <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Education</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {content.education.map((entry) => (
                <div key={entry.id}>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{entry.school}</div>
                  <div style={{ color: '#475569', fontWeight: 500 }}>{entry.degree}</div>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>{formatDateRange(entry.startDate, entry.endDate)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section>
            <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: '#e0f2fe',
                    color: '#0f172a',
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

        {certificates.length > 0 && (
          <section>
            <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Certificates</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
              {certificates.map((certificate) => (
                <li key={certificate.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{certificate.name}</span>
                  <span style={{ color: '#64748b' }}>{certificate.date}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {listSections.map((section) => (
          <section key={section.id}>
            <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>{section.title}</h2>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#475569', lineHeight: 1.6 }}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
