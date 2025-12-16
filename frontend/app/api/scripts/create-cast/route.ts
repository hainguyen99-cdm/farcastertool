import { NextRequest } from 'next/server';
import { forwardJson } from '../../_lib/backend';

export const dynamic = 'force-dynamic';

/**
 * API route for creating a cast with media support
 * 
 * This route handles:
 * 1. Receiving cast text and media files
 * 2. Uploading media to Farcaster's image delivery service
 * 3. Creating the cast with embedded media URLs
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.text();
    const res = await forwardJson('/scripts/create-cast', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.text();
    return new Response(data, { 
      status: res.status, 
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } 
    });
  } catch (error) {
    console.error('Error in create-cast route:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

