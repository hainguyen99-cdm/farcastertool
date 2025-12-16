import { NextRequest } from 'next/server';
import { forwardJson } from '../../_lib/backend';

export const dynamic = 'force-dynamic';

/**
 * API route for generating image upload URL
 * 
 * This calls the Farcaster API to get a temporary upload URL
 * for uploading media files
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.text();
    const res = await forwardJson('/scripts/generate-image-upload-url', {
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
    console.error('Error in generate-image-upload-url route:', error);
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

