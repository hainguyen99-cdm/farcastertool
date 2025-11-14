import { NextRequest, NextResponse } from 'next/server';
import { forwardJson } from '../../_lib/backend';

interface CreateGameRecordPayload {
  privitoken: string;
  gameLabel: string;
  wallet: string;
}

const isValidPayload = (payload: Partial<CreateGameRecordPayload>): payload is CreateGameRecordPayload => {
  return Boolean(payload.privitoken && payload.gameLabel && payload.wallet);
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<CreateGameRecordPayload>;
    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: 'privitoken, gameLabel, and wallet are required' },
        { status: 400 },
      );
    }

    const backendResponse = await forwardJson('/game-records/create-with-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body satisfies CreateGameRecordPayload),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: 'Failed to create game record', details: errorText },
        { status: backendResponse.status },
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error forwarding create-with-token request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

