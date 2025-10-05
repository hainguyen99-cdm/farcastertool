import { NextRequest } from 'next/server';
import { forwardJson } from '../../../../_lib/backend';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; gameLabel: string }> }): Promise<Response> {
  const { id, gameLabel } = await params;
  const res = await forwardJson(`/accounts/${encodeURIComponent(id)}/privy-tokens/${encodeURIComponent(gameLabel)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.text();
  return new Response(data, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
}


