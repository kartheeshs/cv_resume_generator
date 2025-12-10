import { CSSProperties } from 'react';
import { TemplatePreviewProps } from './shared';

function getSection(content: TemplatePreviewProps['content'], id: string) {
  return content.listSections.find((section) => section.id === id);
}

function getItems(content: TemplatePreviewProps['content'], id: string, fallback: string[] = []) {
  return getSection(content, id)?.items ?? fallback;
}

export function TurnerCvTemplate({ content }: TemplatePreviewProps) {
  const coursesLeft = getItems(content, 'turner-courses-left', [
    'Immersive Cost Analytics (LSE)',
    'Financial Statement Analysis (UCSF)',
    'Advanced Excel for Financial Modeling',
    'Derivatives (Options Trading Institute)',
  ]);
  const coursesRight = getItems(content, 'turner-courses-right', [
    'Advanced Public Sector Financial Reporting and Analysis',
    'Corporate Finance',
    'Financial Risk Management (GARP)',
    'Portfolio Simulation Workshop',
  ]);

  const achievementsLeft = getItems(content, 'turner-achievements-left', [
    'Civic Service Awardee (2018) — Santa Monica Community',
    'Leadership Fellowship (2019) — Berkeley Haas Center',
  ]);
  const achievementsRight = getItems(content, 'turner-achievements-right', [
    'Peer Inc. Group of Companies Special Recognition (2017)',
    'Young Entrepreneur Summit Winner (2016)',
  ]);

  const interests = getItems(content, 'turner-interests', [
    'Machine Learning',
    'Calligraphy',
    'Astronomy',
    'Photography',
  ]);

  const volunteerExperiences = content.workExperiences.filter(
    (experience) => experience.category === 'Volunteer Experience'
  );
  const professionalExperiences = content.workExperiences.filter(
    (experience) => experience.category !== 'Volunteer Experience'
  );

  const languagesGroup = content.skillGroups.find((group) => group.id === 'turner-languages');
  const certificationsGroup = content.skillGroups.find((group) => group.id === 'turner-certifications');

  const pageStyle: CSSProperties = {
    width: '760px',
    minHeight: '1040px',
    background: '#ffffff',
    borderRadius: '28px',
    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.12)',
    padding: '64px 72px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  };

  const sectionHeading: CSSProperties = {
    fontSize: '16px',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: '#0f172a',
    marginBottom: '16px',
    fontWeight: 700,
  };

  const columnListStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '18px 28px',
    fontSize: '14px',
    color: '#1f2937',
  };

  const renderExperience = (idPrefix: string, experiences: typeof professionalExperiences) => (
    <div style={{ display: 'grid', gap: '24px' }}>
      {experiences.map((experience, index) => (
        <div key={`${idPrefix}-${experience.id}-${index}`} style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{experience.title}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {[experience.startDate, experience.endDate].filter(Boolean).join(' – ')}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#475569' }}>{experience.company}</div>
          {experience.location ? (
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{experience.location}</div>
          ) : null}
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '13px', color: '#1f2937' }}>
            {experience.bullets.map((bullet, bulletIndex) => (
              <li key={`${experience.id}-bullet-${bulletIndex}`}>{bullet}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #e2e8f0 0%, #f8fafc 45%, #e0f2fe 100%)',
        padding: '32px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={pageStyle}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '0.08em', color: '#0f172a' }}>
                {content.profile.fullName}
              </div>
              <div style={{ fontSize: '18px', color: '#2563eb', fontWeight: 600 }}>{content.profile.role}</div>
              {content.profile.tagline ? (
                <div style={{ fontSize: '13px', color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  {content.profile.tagline}
                </div>
              ) : null}
            </div>
            <div style={{ fontSize: '13px', color: '#1f2937', display: 'grid', gap: '6px', textAlign: 'right' }}>
              {[content.profile.contact.phone, content.profile.contact.email, content.profile.contact.location, content.profile.contact.website]
                .filter(Boolean)
                .map((value) => (
                  <span key={value}>{value}</span>
                ))}
            </div>
          </header>
          <div style={{ height: '2px', background: '#e2e8f0' }} />

          <section>
            <div style={sectionHeading}>Courses &amp; Training</div>
            <div style={columnListStyle}>
              <div style={{ display: 'grid', gap: '10px' }}>
                {coursesLeft.map((item, index) => (
                  <div key={`courses-left-${index}`} style={{ lineHeight: 1.4 }}>{item}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {coursesRight.map((item, index) => (
                  <div key={`courses-right-${index}`} style={{ lineHeight: 1.4 }}>{item}</div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div style={sectionHeading}>Education</div>
            <div style={{ display: 'grid', gap: '18px' }}>
              {content.education.map((entry) => (
                <div key={entry.id} style={{ display: 'grid', gap: '4px', fontSize: '14px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{entry.school}</div>
                  <div style={{ color: '#1f2937' }}>{entry.degree}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {[entry.startDate, entry.endDate].filter(Boolean).join(' – ')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={sectionHeading}>Achievements &amp; Awards</div>
            <div style={columnListStyle}>
              <div style={{ display: 'grid', gap: '12px' }}>
                {achievementsLeft.map((item, index) => (
                  <div key={`achievements-left-${index}`} style={{ lineHeight: 1.4 }}>{item}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {achievementsRight.map((item, index) => (
                  <div key={`achievements-right-${index}`} style={{ lineHeight: 1.4 }}>{item}</div>
                ))}
              </div>
            </div>
          </section>

          {volunteerExperiences.length > 0 ? (
            <section>
              <div style={sectionHeading}>Volunteer Experience</div>
              {renderExperience('volunteer', volunteerExperiences)}
            </section>
          ) : null}

          <section>
            <div style={sectionHeading}>Interests &amp; Hobbies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {interests.map((interest, index) => (
                <span
                  key={`interest-${index}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    background: 'rgba(37, 99, 235, 0.08)',
                    color: '#1d4ed8',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div style={pageStyle}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>
              {content.profile.fullName}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Page 2 of 2</div>
          </header>
          <div style={{ height: '2px', background: '#e2e8f0' }} />

          {content.summary ? (
            <section>
              <div style={sectionHeading}>Professional Summary</div>
              <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', lineHeight: 1.6 }}>{content.summary}</p>
            </section>
          ) : null}

          {professionalExperiences.length > 0 ? (
            <section>
              <div style={sectionHeading}>Professional Experience</div>
              {renderExperience('professional', professionalExperiences)}
            </section>
          ) : null}

          {languagesGroup ? (
            <section>
              <div style={sectionHeading}>{languagesGroup.title}</div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '14px', color: '#1f2937' }}>
                {languagesGroup.skills.map((skill, index) => (
                  <div key={`language-${index}`}>{skill}</div>
                ))}
              </div>
            </section>
          ) : null}

          {certificationsGroup ? (
            <section>
              <div style={sectionHeading}>{certificationsGroup.title}</div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '14px', color: '#1f2937' }}>
                {certificationsGroup.skills.map((skill, index) => (
                  <div key={`certification-${index}`}>{skill}</div>
                ))}
              </div>
            </section>
          ) : null}

          {content.certifications.length > 0 ? (
            <section>
              <div style={sectionHeading}>Credentials</div>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px', color: '#1f2937' }}>
                {content.certifications.map((certificate) => (
                  <div key={certificate.id}>
                    <strong>{certificate.name}</strong>
                    {certificate.date ? ` — ${certificate.date}` : ''}
                    {certificate.organization ? ` · ${certificate.organization}` : ''}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {content.listSections.some((section) => section.id === 'turner-references') ? (
            <section>
              <div style={sectionHeading}>References</div>
              <div style={{ fontSize: '14px', color: '#1f2937', display: 'grid', gap: '12px' }}>
                {getItems(content, 'turner-references').map((reference, index) => (
                  <div key={`reference-${index}`}>{reference}</div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
