import { NextRequest } from 'next/server';
import { forwardJson } from '../_lib/backend';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const res = await forwardJson('/stats', { method: 'GET', cache: 'no-store' });
  const data = await res.text();
  return new Response(data, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
}
