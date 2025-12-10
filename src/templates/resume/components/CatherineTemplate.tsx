import { TemplatePreviewProps, formatDateRange } from './shared';

export function CatherineTemplate({ content }: TemplatePreviewProps) {
  const sidebarGroups = content.skillGroups.filter((group) => group.placement === 'sidebar');
  const mainSkills = content.skillGroups.filter((group) => group.placement !== 'sidebar');
  const sidebarSections = content.listSections.filter((section) => section.placement === 'sidebar');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        background: '#f3f4f6',
        borderRadius: '32px',
        overflow: 'hidden',
        border: '1px solid #d1d5db',
        fontFamily: '"Manrope", Inter, system-ui, sans-serif',
        maxWidth: '1024px',
        margin: '0 auto',
      }}
    >
      <aside style={{ background: '#1f2937', color: '#f8fafc', padding: '48px 40px', display: 'grid', gap: '32px' }}>
        <header>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{content.profile.fullName}</div>
          <div style={{ color: '#e5e7eb', marginTop: '6px', fontSize: '16px' }}>{content.profile.role}</div>
          <div style={{ marginTop: '16px', display: 'grid', gap: '8px', fontSize: '14px' }}>
            {content.profile.contact.email && <span>{content.profile.contact.email}</span>}
            {content.profile.contact.phone && <span>{content.profile.contact.phone}</span>}
            {content.profile.contact.location && <span>{content.profile.contact.location}</span>}
            {content.profile.contact.website && <span>{content.profile.contact.website}</span>}
            {content.profile.contact.linkedin && <span>{content.profile.contact.linkedin}</span>}
          </div>
        </header>

        {sidebarGroups.map((group) => (
          <div key={group.id}>
            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px' }}>{group.title}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '14px' }}>
              {group.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        ))}

        {sidebarSections.map((section) => (
          <div key={section.id}>
            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px' }}>{section.title}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '14px' }}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <main style={{ background: '#fff', padding: '56px 64px', display: 'grid', gap: '36px' }}>
        {content.summary && (
          <section>
            <h2 style={{ fontSize: '22px', color: '#1f2937', marginBottom: '16px' }}>Profile</h2>
            <p style={{ color: '#4b5563', lineHeight: 1.7 }}>{content.summary}</p>
          </section>
        )}

        {content.workExperiences.length > 0 && (
          <section>
            <h2 style={{ fontSize: '22px', color: '#1f2937', marginBottom: '16px' }}>Work Experience</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {content.workExperiences.map((experience) => (
                <article key={experience.id}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>{experience.title}</div>
                      <div style={{ color: '#4b5563', fontWeight: 600 }}>{experience.company}</div>
                      {experience.location && <div style={{ color: '#9ca3af', fontSize: '14px' }}>{experience.location}</div>}
                    </div>
                    <div style={{ color: '#6b7280', fontWeight: 600 }}>{formatDateRange(experience.startDate, experience.endDate)}</div>
                  </header>
                  <ul style={{ marginTop: '12px', marginLeft: '20px', color: '#4b5563', lineHeight: 1.7 }}>
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
            <h2 style={{ fontSize: '22px', color: '#1f2937', marginBottom: '16px' }}>Education</h2>
            <div style={{ display: 'grid', gap: '18px' }}>
              {content.education.map((entry) => (
                <div key={entry.id}>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{entry.degree}</div>
                  <div style={{ color: '#4b5563', fontWeight: 600 }}>{entry.school}</div>
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>{formatDateRange(entry.startDate, entry.endDate)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {mainSkills.length > 0 && (
          <section>
            <h2 style={{ fontSize: '22px', color: '#1f2937', marginBottom: '16px' }}>Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {mainSkills.flatMap((group) => group.skills).map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    background: '#dbeafe',
                    color: '#1d4ed8',
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

        {content.certifications.length > 0 && (
          <section>
            <h2 style={{ fontSize: '22px', color: '#1f2937', marginBottom: '16px' }}>Certifications</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
              {content.certifications.map((certification) => (
                <li key={certification.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600 }}>{certification.name}</span>
                  <span style={{ color: '#6b7280' }}>{certification.date}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
