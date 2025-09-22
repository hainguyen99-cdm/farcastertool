import { NextRequest } from 'next/server';
import { forwardJson } from '../../../_lib/backend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const body = await req.text();
  const res = await forwardJson(`/scenarios/${encodeURIComponent(id)}/execute`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.text();
  return new Response(data, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
}



