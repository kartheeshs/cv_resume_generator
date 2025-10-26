import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { Readable } from 'stream';
import { ResumeDraftContent } from '@/types/resume';
import { renderResumePdf } from '@/templates/resume/pdf';

export const runtime = 'nodejs';

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
  const { templateId, content } = body as {
    templateId?: string;
    content?: ResumeDraftContent;
  };

  if (!templateId || !content) {
    return NextResponse.json(
      { message: 'Missing template or content for resume generation.' },
      { status: 400 }
    );
  }

  const document = renderResumePdf(templateId, content);
  const documentStream = await renderToStream(document);

  const readable = nodeStreamToWebReadable(documentStream as unknown as Readable);

  const filename = (content.documentTitle || 'resume').replace(/\s+/g, '-').toLowerCase();

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    },
  });
}
