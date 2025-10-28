import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ResumeDraftContent } from '@/types/resume';
import { renderResumePdf } from '@/templates/resume/pdf';

export const runtime = 'nodejs';

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
  const pdfBuffer = await renderToBuffer(document);

  const baseTitle = (content.documentTitle || 'resume').trim() || 'resume';

  const encodeRFC5987ValueChars = (str: string) =>
    encodeURIComponent(str)
      .replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
      .replace(/\*/g, '%2A');

  const asciiFallback = baseTitle
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]+/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  const fallbackFilename = asciiFallback || 'resume';
  const encodedFilename = encodeRFC5987ValueChars(`${baseTitle}.pdf`);

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        `attachment; filename="${fallbackFilename}.pdf"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}
