import { NextRequest, NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';
import { Readable } from 'stream';

export const runtime = 'nodejs';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    fontSize: 22,
    marginBottom: 10,
    color: '#111827',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  body: {
    lineHeight: 1.5,
  },
  chipRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
  },
});

function ResumeDocument({
  title,
  summary,
  experience,
  skills,
  templateName,
}: {
  title: string;
  summary: string;
  experience: string;
  skills: string[];
  templateName: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.label}>{templateName}</Text>
          <Text style={styles.header}>{title}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Summary</Text>
          <Text style={styles.body}>{summary}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Experience Highlights</Text>
          <Text style={styles.body}>{experience}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Key Skills</Text>
          <View style={styles.chipRow}>
            {skills.map((skill) => (
              <Text key={skill} style={styles.chip}>
                {skill}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}

function nodeStreamToWebReadable(stream: Readable) {
  return new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', (error) => controller.error(error));
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, summary, experience, skills, templateName } = body;

  if (!title || !summary) {
    return NextResponse.json(
      { message: 'Missing required fields for resume generation.' },
      { status: 400 }
    );
  }

  const documentStream = await renderToStream(
    <ResumeDocument
      title={title}
      summary={summary}
      experience={experience}
      skills={skills ?? []}
      templateName={templateName ?? 'Resume'}
    />
  );

  const readable = nodeStreamToWebReadable(documentStream as unknown as Readable);

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
    },
  });
}
