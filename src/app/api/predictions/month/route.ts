import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const REMOTE = 'https://web-production-e2163.up.railway.app/predict/month';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    if (!year || !month) {
      return NextResponse.json({ error: 'Missing year or month' }, { status: 400 });
    }
    const target = `${REMOTE}?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`;
    const res = await fetch(target, { method: 'GET', cache: 'no-store' });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error', status: res.status, body: text.slice(0, 2000) }, { status: res.status });
    }
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
