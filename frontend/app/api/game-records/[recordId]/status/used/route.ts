import { NextRequest, NextResponse } from 'next/server';
import { forwardJson } from '../../../../_lib/backend';

/**
 * PATCH /api/game-records/[recordId]/status/used
 * 
 * Proxy endpoint to update a game record's status to "Used" by recordId.
 * Forwards the request to the backend and returns the response.
 * 
 * @param recordId - The record ID to update (e.g., 68de4ed95a38e50487dc90e8)
 * @returns Updated game record object or null if not found
 * 
 * Example request:
 * PATCH /api/game-records/68de4ed95a38e50487dc90e8/status/used
 * 
 * Example response:
 * {
 *   "_id": "507f1f77bcf86cd799439011",
 *   "accountId": "507f1f77bcf86cd799439012",
 *   "gameLabel": "test-game",
 *   "recordId": "68de4ed95a38e50487dc90e8",
 *   "status": "Used",
 *   "apiResponse": { ... },
 *   "createdAt": "2024-01-01T00:00:00.000Z"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params;
    
    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const response = await forwardJson(`/game-records/${recordId}/status/used`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to update game record status', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating game record status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}