# Game Records API Proxy Endpoints

This directory contains frontend proxy routes for the game records API endpoints. These routes forward requests to the backend and handle error responses.

## Available Endpoints

### 1. Get Game Records by Wallet Address

**Endpoint**: `GET /api/game-records/wallet/{walletAddress}`

**Description**: Retrieves all unused game records for a specific wallet address.

**Parameters**:
- `walletAddress` (string, required): The wallet address to search for

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/game-records/wallet/0xBffB550F5980598FBeCb80c0078aB38eF5e2590b"
```

**Example Response**:
```json
[
  {
    "userId": "did:privy:cmg93ggib01dbld0c9bfo3505",
    "recordId": "68de4ed95a38e50487dc90e8",
    "gameId": "mazeRunner",
    "points": 91,
    "nonce": 1759399641,
    "to": "0xBffB550F5980598FBeCb80c0078aB38eF5e2590b",
    "signature": "0x030db41628a6e3594db773f3be639f23facab0c70f03e8658bd99710591bbf6615de55e5456bb7952db7ff6620df3f8977a304053dc689dde8bf5c26520db7291b"
  }
]
```

### 2. Update Game Record Status to Used

**Endpoint**: `PATCH /api/game-records/{recordId}/status/used`

**Description**: Updates a game record's status from "Unused" to "Used".

**Parameters**:
- `recordId` (string, required): The record ID to update

**Example Request**:
```bash
curl -X PATCH "http://localhost:3000/api/game-records/68de4ed95a38e50487dc90e8/status/used"
```

**Example Response**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "accountId": "507f1f77bcf86cd799439012",
  "gameLabel": "test-game",
  "recordId": "68de4ed95a38e50487dc90e8",
  "gameId": "mazeRunner",
  "wallet": "0xBffB550F5980598FBeCb80c0078aB38eF5e2590b",
  "status": "Used",
  "apiResponse": {
    "data": {
      "userId": "did:privy:cmg93ggib01dbld0c9bfo3505",
      "recordId": "68de4ed95a38e50487dc90e8",
      "gameId": "mazeRunner",
      "points": 91,
      "nonce": 1759399641,
      "to": "0xBffB550F5980598FBeCb80c0078aB38eF5e2590b",
      "signature": "0x030db41628a6e3594db773f3be639f23facab0c70f03e8658bd99710591bbf6615de55e5456bb7952db7ff6620df3f8977a304053dc689dde8bf5c26520db7291b"
    }
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Usage in Frontend Components

### Using Fetch API

```typescript
// Get game records by wallet address
const getGameRecords = async (walletAddress: string) => {
  try {
    const response = await fetch(`/api/game-records/wallet/${walletAddress}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game records');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game records:', error);
    throw error;
  }
};

// Update game record status to used
const updateRecordStatus = async (recordId: string) => {
  try {
    const response = await fetch(`/api/game-records/${recordId}/status/used`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error('Failed to update record status');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating record status:', error);
    throw error;
  }
};
```

### Using React Hook

```typescript
import { useState, useEffect } from 'react';

const useGameRecords = (walletAddress: string) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/game-records/wallet/${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch game records');
      }
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsUsed = async (recordId: string) => {
    try {
      const response = await fetch(`/api/game-records/${recordId}/status/used`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to update record status');
      }
      // Refresh the records after updating
      await fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [walletAddress]);

  return { records, loading, error, markAsUsed, refetch: fetchRecords };
};
```

## Error Handling

Both endpoints return appropriate HTTP status codes and error messages:

- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Backend connection issues or server errors
- `404 Not Found`: Record not found (for PATCH endpoint)

Error response format:
```json
{
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

## Backend Integration

These proxy routes automatically forward requests to the backend using the `forwardJson` utility, which handles:
- Multiple backend URL candidates
- Automatic failover
- Request forwarding with proper headers
- Error handling and response forwarding
