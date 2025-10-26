import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeDraftContent } from '@/types/resume';

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

function ariaPdf(content: ResumeDraftContent) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 22, letterSpacing: 2, fontWeight: 700 }}>{content.profile.fullName.toUpperCase()}</Text>
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginTop: 4 }}>{content.profile.role}</Text>
          {content.summary ? <Text style={{ marginTop: 10 }}>{content.summary}</Text> : null}
          <Text style={{ marginTop: 8, fontSize: 10, color: '#64748b' }}>
            {[content.profile.contact.email, content.profile.contact.phone, content.profile.contact.location, content.profile.contact.website]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={baseStyles.sectionHeading}>Work Experience</Text>
          {content.workExperiences.map((experience) => renderExperience(experience))}
        </View>

        {content.skillGroups.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={baseStyles.sectionHeading}>Core Skills</Text>
            {renderList(content.skillGroups[0].skills)}
          </View>
        )}

        {content.education.length > 0 && (
          <View>
            <Text style={baseStyles.sectionHeading}>Education</Text>
            {content.education.map((entry) => renderEducation(entry))}
          </View>
        )}
      </Page>
    </Document>
  );
}

function sashaPdf(content: ResumeDraftContent) {
  return (
    <Document>
      <Page size="A4" style={{ ...baseStyles.page, padding: 0 }}>
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
      <Page size="A4" style={{ ...baseStyles.page, padding: 0 }}>
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

function catherinePdf(content: ResumeDraftContent) {
  return (
    <Document>
      <Page size="A4" style={{ ...baseStyles.page, padding: 0 }}>
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
};

export function renderResumePdf(templateId: string, content: ResumeDraftContent) {
  const renderer = pdfRenderers[templateId] ?? ariaPdf;
  return renderer(content);
}
