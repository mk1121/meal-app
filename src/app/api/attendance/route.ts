import { NextResponse } from 'next/server';
import https from 'https';

// Force Node.js runtime to avoid any edge-related network quirks on LAN
export const runtime = 'nodejs';

// Create an agent that disables SSL verification.
// NOTE: This is insecure and should only be used for development.
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Prefer server-only secrets; fall back to public or defaults if needed
const GET_URL =
  process.env.ORDS_GET_URL?.trim() ||
  process.env.NEXT_PUBLIC_ORDS_GET_URL?.trim() ||
  'https://mailnts.informatixsystems.com:8443/ords/intern/NTS/attendance';

const SAVE_URL =
  process.env.ORDS_SAVE_URL?.trim() ||
  process.env.NEXT_PUBLIC_ORDS_SAVE_URL?.trim() ||
  // Per latest requirement, POST to NTS/attendance
  'https://mailnts.informatixsystems.com:8443/ords/intern/NTS/attendance';

const AUTH_TOKEN = process.env.ORDS_TOKEN?.trim() || process.env.NEXT_PUBLIC_ORDS_TOKEN?.trim();

export async function GET(req: Request) {
  // Use native https module to prevent fetch from re-encoding the URL slashes
  return new Promise<NextResponse>((resolve) => {
    try {
      console.log('[API][attendance][GET] url=', req.url);
      const { searchParams } = new URL(req.url);
      const attendance_date = searchParams.get('attendance_date') || '';
      const limit = searchParams.get('limit') || '25';
      const offset = searchParams.get('offset') || '0';

      const remoteUrl = new URL(GET_URL);
      const path = `${remoteUrl.pathname}?attendance_date=${attendance_date}&limit=${limit}&offset=${offset}`;

      const options: https.RequestOptions = {
        hostname: remoteUrl.hostname,
        port: remoteUrl.port,
        path: path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // This is needed if NODE_TLS_REJECT_UNAUTHORIZED is not set
        rejectUnauthorized: false,
      };

      const proxyReq = https.request(options, (proxyRes) => {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', (chunk) => {
          body += chunk;
        });
        proxyRes.on('end', () => {
          console.log('[API][attendance][GET] upstream response', {
            status: proxyRes.statusCode,
            body: body.slice(0, 500),
          });

          const status = proxyRes.statusCode || 500;
          if (status >= 200 && status < 300) {
            resolve(new NextResponse(body, {
              status: status,
              headers: { 'Content-Type': 'application/json' },
            }));
          } else {
            resolve(NextResponse.json(
              { error: 'Upstream error', status: status, body: body.slice(0, 2000) },
              { status: status }
            ));
          }
        });
      });

      proxyReq.on('error', (err) => {
        console.error('[API][attendance][GET] Request failed:', err);
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      });

      proxyReq.end();

    } catch (err) {
      const error = err as Error;
      console.error('[API][attendance][GET] Handler failed:', error);
      resolve(NextResponse.json({ error: error.message }, { status: 500 }));
    }
  });
}

export async function POST(req: Request) {
  try {
    console.log('[API][attendance][POST]');
    const body = await req.text();
    const res = await fetch(SAVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
      body,
  // @ts-expect-error: fetch init supports agent in Node runtime; types may not include it
      agent: httpsAgent,
      cache: 'no-store',
    });

    const text = await res.text();
    if (!res.ok) {
      // Forward upstream error body for debugging (e.g., ORDS-25001)
      return NextResponse.json(
        { error: 'Upstream error', status: res.status, body: text.slice(0, 2000) },
        { status: res.status }
      );
    }
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
