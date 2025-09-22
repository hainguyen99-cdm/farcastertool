import { NextRequest } from 'next/server';
import { getApiBaseUrl } from '../../_lib/backend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  const formData = await req.formData();
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/accounts/import`, {
    method: 'POST',
    body: formData as unknown as BodyInit,
  });
  const data = await response.text();
  return new Response(data, { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' } });
}



