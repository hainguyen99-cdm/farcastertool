import { NextRequest } from 'next/server';
import { forwardJson } from '../../../_lib/backend';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const res = await forwardJson(`/accounts/${encodeURIComponent(id)}/update-wallet-username`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.text();
  return new Response(data, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
}

