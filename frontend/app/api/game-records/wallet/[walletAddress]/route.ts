import { NextRequest, NextResponse } from 'next/server';
import { forwardJson } from '../../../_lib/backend';

/**
 * GET /api/game-records/wallet/[walletAddress]
 * 
 * Proxy endpoint to get unused game record data for a specific wallet address.
 * Forwards the request to the backend and returns the response.
 * 
 * @param walletAddress - The wallet address to search for (e.g., 0xBffB550F5980598FBeCb80c0078aB38eF5e2590b)
 * @returns Array of data objects from unused game records
 * 
 * Example request:
 * GET /api/game-records/wallet/0xBffB550F5980598FBeCb80c0078aB38eF5e2590b
 * 
 * Example response:
 * [
 *   {
 *     "userId": "did:privy:cmg93ggib01dbld0c9bfo3505",
 *     "recordId": "68de4ed95a38e50487dc90e8",
 *     "gameId": "mazeRunner",
 *     "points": 91,
 *     "nonce": 1759399641,
 *     "to": "0xBffB550F5980598FBeCb80c0078aB38eF5e2590b",
 *     "signature": "0x030db41628a6e3594db773f3be639f23facab0c70f03e8658bd99710591bbf6615de55e5456bb7952db7ff6620df3f8977a304053dc689dde8bf5c26520db7291b"
 *   }
 * ]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const response = await forwardJson(`/game-records/wallet/${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch game records', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching game records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}