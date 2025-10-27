import { NextResponse } from 'next/server';
import https from 'https';

export const runtime = 'nodejs';

// Insecure agent for development/LAN to bypass self-signed TLS issues
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const ING_URL =
  process.env.ORDS_INGREDIENTS_URL?.trim() ||
  process.env.NEXT_PUBLIC_ORDS_INGREDIENTS_URL?.trim() ||
  'https://mailnts.informatixsystems.com:8443/ords/intern/mms_ingredients/all';

const AUTH_TOKEN = process.env.ORDS_TOKEN?.trim() || process.env.NEXT_PUBLIC_ORDS_TOKEN?.trim();

export async function GET() {
  try {
    const res = await fetch(ING_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
      // @ts-expect-error node fetch supports agent in node runtime
      agent: httpsAgent,
      cache: 'no-store',
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream error', status: res.status, body: text.slice(0, 2000) },
        { status: res.status }
      );
    }
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
