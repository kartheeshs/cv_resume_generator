import { NextResponse } from 'next/server';

type DeleteUserPayload = {
  userId?: string;
  email?: string;
};

async function sendDeletionEmail(email: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (resendKey && fromEmail) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: 'Career Studio GM7 account removed',
          html: `
            <p>Hi there,</p>
            <p>Your Career Studio GM7 workspace access has been removed by an administrator. Your drafts and downloads will be deleted according to our retention policies.</p>
            <p>If you believe this was a mistake, reply to this email or contact support to review the change.</p>
            <p>— Career Studio GM7 Support</p>
          `,
        }),
      });
      if (response.ok) {
        return true;
      }
      console.error('Resend API responded with status', response.status);
    } catch (error) {
      console.error('Failed to dispatch Resend email', error);
    }
  }

  const webhook = process.env.ADMIN_DELETE_USER_WEBHOOK;
  if (webhook) {
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, event: 'user_deleted' }),
      });
      if (response.ok) {
        return true;
      }
      console.error('Webhook email fallback failed with status', response.status);
    } catch (error) {
      console.error('Webhook email fallback errored', error);
    }
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DeleteUserPayload;
    if (!payload?.userId || !payload?.email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    const emailSent = await sendDeletionEmail(payload.email);

    return NextResponse.json({ emailSent });
  } catch (error) {
    console.error('Failed to process admin delete-user request', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
