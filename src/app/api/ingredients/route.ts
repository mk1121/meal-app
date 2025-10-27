import { NextResponse } from 'next/server';
import https from 'https';

export const runtime = 'nodejs';

// Note: Using native https.request below with rejectUnauthorized:false per request

const ING_URL =
  process.env.ORDS_INGREDIENTS_URL?.trim() ||
  process.env.NEXT_PUBLIC_ORDS_INGREDIENTS_URL?.trim() ||
  'https://mailnts.informatixsystems.com:8443/ords/intern/mms_ingredients/all';

const AUTH_TOKEN = process.env.ORDS_TOKEN?.trim() || process.env.NEXT_PUBLIC_ORDS_TOKEN?.trim();

export async function GET() {
  // Use native https to better control TLS and avoid undici agent limitations
  return new Promise<NextResponse>((resolve) => {
    try {
      const remoteUrl = new URL(ING_URL);
      const options: https.RequestOptions = {
        hostname: remoteUrl.hostname,
        port: remoteUrl.port || 443,
        path: remoteUrl.pathname + (remoteUrl.search || ''),
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
        },
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          const status = res.statusCode || 500;
          if (status >= 200 && status < 300) {
            resolve(new NextResponse(body, { status, headers: { 'Content-Type': 'application/json' } }));
          } else {
            resolve(NextResponse.json({ error: 'Upstream error', status, body: body.slice(0, 2000) }, { status }));
          }
        });
      });

      req.on('error', (err) => {
        resolve(NextResponse.json({ error: (err as Error).message }, { status: 500 }));
      });

      req.end();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      resolve(NextResponse.json({ error: msg }, { status: 500 }));
    }
  });
}
