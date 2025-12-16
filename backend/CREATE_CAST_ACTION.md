# CREATE_CAST Action Documentation

## Overview

The `CREATE_CAST` action allows you to create casts (posts) on Farcaster with optional media attachments. This action handles the complete flow of:

1. **Generating an image upload URL** - Request a unique upload URL from Farcaster's image delivery service
2. **Uploading media** - Upload image/media files to the generated URL
3. **Creating a cast** - Post the cast with the media URL as an embed

## Action Type

```typescript
ActionType.CREATE_CAST = 'CreateCast'
```

## Configuration

The `CREATE_CAST` action accepts the following configuration:

```typescript
{
  type: ActionType.CREATE_CAST,
  config: {
    text: string;              // Required: The text content of the cast
    mediaUrls?: string[];      // Optional: Array of media URLs to embed in the cast
  }
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | The text content of the cast. This is what will be posted on Farcaster. |
| `mediaUrls` | string[] | No | Array of media URLs to include as embeds in the cast. These should be URLs returned from the media upload process. |

## Usage Examples

### Example 1: Create a Text-Only Cast

```typescript
const action: ScriptAction = {
  type: ActionType.CREATE_CAST,
  config: {
    text: "I love Farcaster! 🚀"
  }
};
```

### Example 2: Create a Cast with Media

```typescript
const action: ScriptAction = {
  type: ActionType.CREATE_CAST,
  config: {
    text: "Check out this amazing image!",
    mediaUrls: [
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original"
    ]
  }
};
```

### Example 3: Create a Cast with Multiple Media

```typescript
const action: ScriptAction = {
  type: ActionType.CREATE_CAST,
  config: {
    text: "Multiple images in one cast!",
    mediaUrls: [
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image1/original",
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image2/original",
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image3/original"
    ]
  }
};
```

## API Flow

### Step 1: Generate Image Upload URL

**Endpoint:** `POST /v1/generate-image-upload-url`

**Request:**
```bash
curl "https://client.farcaster.xyz/v1/generate-image-upload-url" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  --data-raw "{}"
```

**Response:**
```json
{
  "url": "https://upload.imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300",
  "optimisticImageId": "e60570cf-4555-438c-4463-59f997f4c300"
}
```

### Step 2: Upload Media File

**Endpoint:** `POST <upload_url>` (from Step 1)

**Request:**
```bash
curl "<upload_url>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@image.png"
```

**Response:**
```json
{
  "result": {
    "id": "e60570cf-4555-438c-4463-59f997f4c300",
    "filename": "image.png",
    "meta": {
      "fid": 1357321
    },
    "uploaded": "2025-12-16T02:52:31.953Z",
    "requireSignedURLs": false,
    "variants": [
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original",
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/rectscaledown1",
      "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/squarecrop3",
      ...
    ]
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

### Step 3: Create Cast

**Endpoint:** `POST /v2/casts`

**Request:**
```bash
curl "https://client.farcaster.xyz/v2/casts" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "text": "I love Farcaster",
    "embeds": ["https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original"]
  }'
```

**Response:**
```json
{
  "result": {
    "cast": {
      "hash": "0x1234567890abcdef",
      "text": "I love Farcaster",
      "embeds": [
        {
          "url": "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original"
        }
      ]
    }
  }
}
```

## Using the Command-Line Script

A TypeScript script is provided to test the CREATE_CAST functionality from the command line:

### Installation

```bash
cd backend
npm install
```

### Usage

#### Text-Only Cast

```bash
npx ts-node scripts/createCast.ts \
  --token "your-encrypted-token" \
  --text "I love Farcaster"
```

#### Cast with Media

```bash
npx ts-node scripts/createCast.ts \
  --token "your-encrypted-token" \
  --text "Check out this image!" \
  --media ./path/to/image.png
```

#### With Custom Base URL

```bash
npx ts-node scripts/createCast.ts \
  --token "your-encrypted-token" \
  --text "Hello Farcaster" \
  --media ./image.jpg \
  --base-url "https://custom.farcaster.xyz"
```

### Script Output

The script provides detailed logging of each step:

```
🚀 Starting cast creation with media...

📋 Step 1: Generating image upload URL...
✅ Upload URL generated successfully
   URL: https://upload.imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300
   Image ID: e60570cf-4555-438c-4463-59f997f4c300

📤 Step 2: Uploading media file: ./image.png
   File size: 125.45 KB
   MIME type: image/png
✅ Media uploaded successfully
   Image ID: e60570cf-4555-438c-4463-59f997f4c300
   Uploaded at: 2025-12-16T02:52:31.953Z
   Available variants: 20

📎 Media URL for embed: https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original

✍️  Step 3: Creating cast...
   Text: "Check out this image!"
   Media embeds: 1
     1. https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original
✅ Cast created successfully
   Cast hash: 0x1234567890abcdef
   Text: "Check out this image!"
   Embeds: 1

✨ Cast creation complete!
```

## Integration with Scripts

### Example Script with CREATE_CAST

```typescript
const script = {
  name: "Create Cast with Media",
  actions: [
    {
      type: ActionType.UPDATE_WALLET,
      config: {},
      order: 0
    },
    {
      type: ActionType.CREATE_CAST,
      config: {
        text: "Automated cast from my bot! 🤖",
        mediaUrls: [
          "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image-id/original"
        ]
      },
      order: 1
    }
  ],
  shuffle: false,
  loop: 1
};
```

### Execute Script

```bash
curl -X POST http://localhost:3000/scripts/execute \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-id-here",
    "actions": [
      {
        "type": "CreateCast",
        "config": {
          "text": "Hello from my script!",
          "mediaUrls": []
        },
        "order": 0
      }
    ]
  }'
```

## Error Handling

The CREATE_CAST action includes comprehensive error handling:

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing text for CREATE_CAST action` | The `text` field is not provided | Add the `text` field to the action config |
| `Failed to generate image upload URL` | Farcaster API error | Check token validity and network connectivity |
| `Failed to upload media file` | File upload failed | Verify file exists and is readable |
| `Failed to create cast` | Cast creation failed | Check text length and media URL validity |

## Supported Media Types

The following media types are supported:

- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/gif` (.gif)
- `image/webp` (.webp)

## Rate Limiting

The CREATE_CAST action respects Farcaster's rate limits:

- **Max requests per second:** 5 per token
- **Retry strategy:** Exponential backoff (3 attempts max)
- **Initial backoff:** 300ms

## Best Practices

1. **Use descriptive text:** Make your cast text engaging and clear
2. **Optimize media:** Compress images before uploading to reduce file size
3. **Test first:** Use the command-line script to test before automating
4. **Handle errors:** Implement proper error handling in your scripts
5. **Rate limit:** Space out cast creation to avoid hitting rate limits
6. **Unique content:** Avoid posting identical casts repeatedly

## Troubleshooting

### Token Issues

If you get authentication errors:
1. Verify the token is properly encrypted
2. Check that the token hasn't expired
3. Ensure the token has the necessary permissions

### Media Upload Failures

If media upload fails:
1. Check file size (keep under 10MB recommended)
2. Verify file format is supported
3. Check network connectivity
4. Try with a different image file

### Cast Creation Failures

If cast creation fails:
1. Verify text is not empty
2. Check text length (max 300 characters)
3. Validate media URLs are accessible
4. Check account has posting permissions

## See Also

- [Action Types Documentation](./SCRIPT_LOOPS.md)
- [Script Execution Guide](./SCRIPT_LOOPS.md)
- [Farcaster API Reference](https://docs.farcaster.xyz)

