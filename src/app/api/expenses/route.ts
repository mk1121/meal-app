import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || '';
    const target = `${GET_URL}?date=${date}`;
    const res = await fetch(target, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
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
