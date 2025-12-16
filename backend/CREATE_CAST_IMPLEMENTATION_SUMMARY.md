# CREATE_CAST Implementation Summary

## Overview

A complete implementation of the `CREATE_CAST` action type has been added to the Farcaster bot system. This action enables automated creation of casts (posts) on Farcaster with optional media attachments.

## Changes Made

### 1. **Action Type Definition** (`backend/src/scenario.schema.ts`)

Added `CREATE_CAST` to the `ActionType` enum:

```typescript
export enum ActionType {
  // ... existing types ...
  CREATE_CAST = 'CreateCast',
}
```

### 2. **Farcaster Service Methods** (`backend/src/farcaster.service.ts`)

Added three new methods to handle the complete cast creation flow:

#### `generateImageUploadUrl(encryptedToken: string)`
- Generates a unique image upload URL from Farcaster's image delivery service
- Returns: `{ url: string; optimisticImageId: string }`
- Endpoint: `POST /v1/generate-image-upload-url`

#### `uploadMediaFile(uploadUrl: string, fileBuffer: Buffer, fileName: string, mimeType?: string)`
- Uploads media files to the generated upload URL
- Supports: JPEG, PNG, GIF, WebP
- Returns: Image metadata with available variants
- Endpoint: `POST <upload_url>`

#### `createCast(encryptedToken: string, text: string, embeds?: string[])`
- Creates a cast with text and optional media embeds
- Parameters:
  - `text`: Cast content (required)
  - `embeds`: Array of media URLs (optional)
- Returns: Cast response with hash and metadata
- Endpoint: `POST /v2/casts`

#### `generateIdempotencyKey()`
- Helper method to generate unique idempotency keys for API requests
- Ensures request uniqueness and prevents duplicates

### 3. **Action Processor Handler** (`backend/src/action.processor.ts`)

Added `CREATE_CAST` case handler in the action processor:

```typescript
case ActionType.CREATE_CAST:
case 'CreateCast': {
  const text = action.config['text'] as string;
  const mediaUrls = action.config['mediaUrls'] as string[] | undefined;
  
  if (!text) {
    throw new Error('Missing text for CREATE_CAST action');
  }
  
  result = await this.farcasterService.createCast(encryptedToken, text, mediaUrls);
  break;
}
```

## Files Created

### 1. **Command-Line Script** (`backend/scripts/createCast.ts`)

A comprehensive TypeScript script for testing CREATE_CAST functionality from the command line.

**Features:**
- Generate upload URLs
- Upload media files
- Create casts with or without media
- Detailed logging of each step
- Support for multiple image formats
- Error handling and retry logic

**Usage:**
```bash
# Text-only cast
npx ts-node scripts/createCast.ts --token "token" --text "Hello Farcaster"

# Cast with media
npx ts-node scripts/createCast.ts --token "token" --text "Check this out!" --media ./image.png
```

### 2. **Documentation** (`backend/CREATE_CAST_ACTION.md`)

Comprehensive documentation including:
- Action configuration and parameters
- Usage examples (text-only, single media, multiple media)
- Complete API flow documentation
- Command-line script usage guide
- Error handling guide
- Best practices
- Troubleshooting section

### 3. **Example Scripts** (`backend/scripts/examples/createCastExample.ts`)

Six practical examples demonstrating:
1. Text-only cast creation
2. Cast with single media
3. Cast with multiple media
4. Complex script with multiple actions
5. Looped script (multiple casts)
6. Multi-account execution

**Usage:**
```bash
npx ts-node scripts/examples/createCastExample.ts 1
npx ts-node scripts/examples/createCastExample.ts 1 2 3
```

## API Flow

### Complete Media Upload and Cast Creation Flow

```
1. Generate Upload URL
   POST /v1/generate-image-upload-url
   ↓
2. Upload Media File
   POST <upload_url>
   ↓
3. Create Cast with Media
   POST /v2/casts
   {
     "text": "Your cast text",
     "embeds": ["https://imagedelivery.net/.../original"]
   }
```

## Configuration Example

### In Script Definition

```typescript
{
  type: ActionType.CREATE_CAST,
  config: {
    text: "I love Farcaster! 🚀",
    mediaUrls: [
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image-id/original"
    ]
  },
  order: 0
}
```

### Via API

```bash
curl -X POST http://localhost:3000/scripts/execute \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-id",
    "actions": [
      {
        "type": "CreateCast",
        "config": {
          "text": "Hello Farcaster!",
          "mediaUrls": []
        },
        "order": 0
      }
    ]
  }'
```

## Key Features

✅ **Text-Only Casts** - Create simple text posts
✅ **Media Support** - Upload and embed images
✅ **Multiple Media** - Support for multiple embeds in one cast
✅ **Error Handling** - Comprehensive error messages and recovery
✅ **Rate Limiting** - Respects Farcaster's rate limits (5 req/sec)
✅ **Retry Logic** - Exponential backoff with 3 retry attempts
✅ **Idempotency** - Unique keys prevent duplicate requests
✅ **Logging** - Detailed logging for debugging
✅ **Type Safety** - Full TypeScript support

## Supported Media Types

- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/gif` (.gif)
- `image/webp` (.webp)

## Error Handling

The implementation includes comprehensive error handling for:

- Missing required parameters
- Invalid tokens
- Network failures
- File upload errors
- API errors
- Rate limiting

All errors are logged and propagated with descriptive messages.

## Rate Limiting

- **Max requests:** 5 per second per token
- **Retry attempts:** 3 (with exponential backoff)
- **Initial backoff:** 300ms
- **Max backoff:** 5000ms

## Testing

### Test the Command-Line Script

```bash
# Ensure backend is running
npm run start

# In another terminal, test the script
npx ts-node scripts/createCast.ts \
  --token "your-encrypted-token" \
  --text "Test cast from script" \
  --media ./test-image.png
```

### Test via API

```bash
curl -X POST http://localhost:3000/scripts/execute \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "test-account-id",
    "actions": [{
      "type": "CreateCast",
      "config": {
        "text": "Test cast via API"
      },
      "order": 0
    }]
  }'
```

## Integration with Existing System

The CREATE_CAST action integrates seamlessly with:

- **Script Execution Service** - Executes as part of script workflows
- **Action Processor** - Handles action processing and logging
- **Farcaster Service** - Uses existing service for API calls
- **Logging Service** - Logs all cast creation attempts
- **Account Service** - Uses account tokens for authentication

## Dependencies

The implementation uses:

- `axios` - HTTP client
- `form-data` - Multipart form data handling
- `@nestjs/axios` - NestJS HTTP module
- `@nestjs/bull` - Job queue processing

All dependencies are already in the project.

## Next Steps

1. **Test the implementation** using the provided scripts
2. **Integrate into workflows** by adding CREATE_CAST actions to scripts
3. **Monitor performance** using the logging system
4. **Extend functionality** if needed (e.g., scheduled posts, templates)

## Documentation Files

- `CREATE_CAST_ACTION.md` - Detailed action documentation
- `CREATE_CAST_IMPLEMENTATION_SUMMARY.md` - This file
- `scripts/createCast.ts` - Command-line testing tool
- `scripts/examples/createCastExample.ts` - Usage examples

## Support

For issues or questions:

1. Check the troubleshooting section in `CREATE_CAST_ACTION.md`
2. Review the examples in `scripts/examples/createCastExample.ts`
3. Check logs for detailed error messages
4. Verify token validity and permissions

