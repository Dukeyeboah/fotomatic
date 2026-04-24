import { NextResponse } from 'next/server';

const DEFAULT_TO = 'contact@houseofstole.com';

function formatBody(data: Record<string, unknown>): string {
  const lines = [
    'New Fotomatic photographer application',
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `City: ${data.city}`,
    `State/region: ${data.state || '—'}`,
    `Country: ${data.country}`,
    `Instagram: ${data.instagram || '—'}`,
    `Website: ${data.website || '—'}`,
    `Portfolio links:\n${data.portfolioLinks || '—'}`,
    `How they heard: ${data.howDidYouHear || '—'}`,
    `Interested in client work: ${data.interestedInClientWork ? 'Yes' : 'No'}`,
  ];
  return lines.join('\n');
}

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = String(data.name ?? '').trim();
  const email = String(data.email ?? '').trim();
  const city = String(data.city ?? '').trim();
  const country = String(data.country ?? '').trim();

  if (!name || !email || !email.includes('@') || !city || !country) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const to =
    process.env.PHOTOGRAPHER_APPLICATION_NOTIFY_EMAIL?.trim() || DEFAULT_TO;
  const key = process.env.RESEND_API_KEY?.trim();

  if (!key) {
    console.warn(
      '[notify-photographer-application] RESEND_API_KEY is not set; email skipped',
    );
    return NextResponse.json({ emailed: false, skipped: true as const });
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'Fotomatic <onboarding@resend.dev>';

  const text = formatBody(data);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Fotomatic photographer application: ${name}`,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[notify-photographer-application] Resend error:', errText);
    return NextResponse.json(
      { emailed: false, error: 'email_provider_error' },
      { status: 502 },
    );
  }

  return NextResponse.json({ emailed: true as const });
}
