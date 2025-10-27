import { NextResponse } from 'next/server';
import https from 'https';

export const runtime = 'nodejs';

// Insecure agent for self-signed TLS during development (LAN/mobile)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const SAVE_URL =
  process.env.ORDS_EXPENSE_SAVE_URL?.trim() ||
  process.env.NEXT_PUBLIC_ORDS_EXPENSE_SAVE_URL?.trim() ||
  'https://mailnts.informatixsystems.com:8443/ords/intern/NTS/expense';

const GET_URL =
  process.env.ORDS_EXPENSE_GET_URL?.trim() ||
  process.env.NEXT_PUBLIC_ORDS_EXPENSE_GET_URL?.trim() ||
  'https://mailnts.informatixsystems.com:8443/ords/intern/NTS/expense';

const AUTH_TOKEN = process.env.ORDS_TOKEN?.trim() || process.env.NEXT_PUBLIC_ORDS_TOKEN?.trim();

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const res = await fetch(SAVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
      body,
      // @ts-expect-error Node fetch supports agent in Node runtime
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
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return new Promise<NextResponse>((resolve) => {
    try {
      const { searchParams } = new URL(req.url);
      const date = searchParams.get('date') || '';

      const remoteUrl = new URL(GET_URL);
      const path = `${remoteUrl.pathname}?date=${date}`; // keep raw slashes in date

      const options: https.RequestOptions = {
        hostname: remoteUrl.hostname,
        port: remoteUrl.port,
        path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
        },
        rejectUnauthorized: false,
      };

      const proxyReq = https.request(options, (proxyRes) => {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', (chunk) => { body += chunk; });
        proxyRes.on('end', () => {
          const status = proxyRes.statusCode || 500;
          if (status >= 200 && status < 300) {
            resolve(new NextResponse(body, { status, headers: { 'Content-Type': 'application/json' } }));
          } else {
            resolve(NextResponse.json({ error: 'Upstream error', status, body: body.slice(0, 2000) }, { status }));
          }
        });
      });

      proxyReq.on('error', (err) => {
        resolve(NextResponse.json({ error: (err as Error).message }, { status: 500 }));
      });

      proxyReq.end();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      resolve(NextResponse.json({ error: msg }, { status: 500 }));
    }
  });
}
