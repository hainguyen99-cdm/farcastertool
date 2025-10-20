import { NextRequest } from 'next/server';
import { forwardJson } from '../../api/_lib/backend';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    console.log('Health check request received');
    
    // Try to connect to backend
    const response = await forwardJson('/accounts', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        backend: 'connected',
        message: 'Backend connection successful' 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } else {
      return new Response(JSON.stringify({ 
        status: 'unhealthy', 
        backend: 'error',
        message: `Backend returned ${response.status}` 
      }), { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  } catch (err) {
    console.error('Health check failed:', err);
    return new Response(JSON.stringify({ 
      status: 'unhealthy', 
      backend: 'disconnected',
      message: `Backend connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
    }), { 
      status: 503, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
