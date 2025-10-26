import { TemplatePreviewProps, formatDateRange } from './shared';

export function SashaTemplate({ content }: TemplatePreviewProps) {
  const sidebarSkills = content.skillGroups.filter((group) => group.placement !== 'main');
  const mainSkills = content.skillGroups.filter((group) => group.placement === 'main');
  const sidebarSections = content.listSections.filter((section) => section.placement !== 'main');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        fontFamily: '"Source Serif Pro", Georgia, serif',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 28px 72px rgba(15, 23, 42, 0.12)',
        border: '1px solid #0f172a',
        maxWidth: '980px',
        margin: '0 auto',
      }}
    >
      <aside
        style={{
          background: '#10172a',
          color: '#f8fafc',
          padding: '48px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
        }}
      >
        <div>
          <div style={{ fontSize: '32px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {content.profile.fullName}
          </div>
          <div style={{ marginTop: '8px', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            {content.profile.role}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '8px', fontSize: '14px', letterSpacing: '0.05em' }}>
          {content.profile.contact.email && <span>{content.profile.contact.email}</span>}
          {content.profile.contact.phone && <span>{content.profile.contact.phone}</span>}
          {content.profile.contact.location && <span>{content.profile.contact.location}</span>}
          {content.profile.contact.linkedin && <span>{content.profile.contact.linkedin}</span>}
          {content.profile.contact.website && <span>{content.profile.contact.website}</span>}
        </div>

        {content.education.length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px' }}>Education</h3>
            {content.education.map((entry) => (
              <div key={entry.id} style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 700 }}>{entry.degree}</div>
                <div>{entry.school}</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>{formatDateRange(entry.startDate, entry.endDate)}</div>
              </div>
            ))}
          </div>
        )}

        {sidebarSections.map((section) => (
          <div key={section.id}>
            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px' }}>{section.title}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px', fontSize: '14px' }}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        {sidebarSkills.map((group) => (
          <div key={group.id}>
            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px' }}>{group.title}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px', fontSize: '14px' }}>
              {group.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <main style={{ background: '#f8fafc', padding: '56px 64px', display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {content.objective && (
          <section>
            <h2 style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.4em', color: '#0f172a', marginBottom: '12px' }}>
              Career Objective
            </h2>
            <p style={{ color: '#1e293b', lineHeight: 1.7, fontSize: '15px' }}>{content.objective}</p>
          </section>
        )}

        {content.workExperiences.length > 0 && (
          <section>
            <h2 style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.4em', color: '#0f172a', marginBottom: '20px' }}>
              Work Experience
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {content.workExperiences.map((experience) => (
                <article key={experience.id}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 700 }}>{experience.title}</div>
                      <div style={{ color: '#475569', fontWeight: 600 }}>{experience.company}</div>
                    </div>
                    <div style={{ color: '#475569', fontWeight: 600 }}>{formatDateRange(experience.startDate, experience.endDate)}</div>
                  </header>
                  <ul style={{ marginTop: '12px', marginLeft: '20px', color: '#1e293b', lineHeight: 1.7 }}>
                    {experience.bullets.map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {mainSkills.length > 0 && (
          <section>
            <h2 style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.4em', color: '#0f172a', marginBottom: '20px' }}>
              Skills
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {mainSkills.flatMap((group) => group.skills).map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    border: '1px solid #0f172a',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
