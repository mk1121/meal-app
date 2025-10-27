import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const now = new Date().toISOString();
  return NextResponse.json({ ok: true, time: now, url: url.toString(), host: url.host });
}
