import { NextRequest } from 'next/server';
import { forwardJson } from '../../_lib/backend';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const body = await req.text();
  const res = await forwardJson(`/accounts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.text();
  return new Response(data, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const res = await forwardJson(`/accounts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return new Response(null, { status: res.status });
}



