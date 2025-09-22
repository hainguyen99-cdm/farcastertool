import { NextRequest } from 'next/server';
import { forwardJson } from '../_lib/backend';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const res = await forwardJson('/accounts', { method: 'GET', cache: 'no-store' });
  const data = await res.text();
  return new Response(data, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
}

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.text();
  const res = await forwardJson('/accounts', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
  const data = await res.text();
  return new Response(data, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
}



