# CREATE_CAST Quick Start Guide

## 🚀 Quick Overview

The `CREATE_CAST` action allows you to create posts on Farcaster with optional media attachments.

## 📋 Basic Configuration

```typescript
{
  type: 'CreateCast',
  config: {
    text: 'Your post text here',
    mediaUrls: ['https://image-url.com/image.jpg'] // Optional
  }
}
```

## 🎯 Three Ways to Use

### 1. **Text-Only Cast** (Simplest)

```typescript
{
  type: 'CreateCast',
  config: {
    text: 'Hello Farcaster! 🚀'
  }
}
```

### 2. **Cast with Media URL**

```typescript
{
  type: 'CreateCast',
  config: {
    text: 'Check out this image!',
    mediaUrls: [
      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/image-id/original'
    ]
  }
}
```

### 3. **Cast with Multiple Media**

```typescript
{
  type: 'CreateCast',
  config: {
    text: 'Multiple images!',
    mediaUrls: [
      'https://imagedelivery.net/.../image1/original',
      'https://imagedelivery.net/.../image2/original',
      'https://imagedelivery.net/.../image3/original'
    ]
  }
}
```

## 🛠️ Command Line Usage

### Install Dependencies

```bash
cd backend
npm install
```

### Create Text-Only Cast

```bash
npx ts-node scripts/createCast.ts \
  --token "your-encrypted-token" \
  --text "Hello Farcaster"
```

### Create Cast with Media

```bash
npx ts-node scripts/createCast.ts \
  --token "your-encrypted-token" \
  --text "Check this out!" \
  --media ./image.png
```

## 📡 API Usage

### Execute via Script API

```bash
curl -X POST http://localhost:3000/scripts/execute \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "your-account-id",
    "actions": [
      {
        "type": "CreateCast",
        "config": {
          "text": "Hello from API!"
        },
        "order": 0
      }
    ]
  }'
```

## 🔄 Complete Flow (Behind the Scenes)

```
1. Generate Upload URL
   ↓
2. Upload Media File (if provided)
   ↓
3. Create Cast with Media URL (if media) or Text Only
```

## ✅ Requirements

- ✓ Encrypted Farcaster token
- ✓ Valid account ID
- ✓ Cast text (required)
- ✓ Media URLs (optional, must be valid URLs)

## ❌ Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Missing text for CREATE_CAST action` | Add `text` field to config |
| `Failed to create cast` | Check token validity |
| `Invalid media URL` | Verify URL is accessible |
| `File not found` | Check file path exists |

## 📝 Real-World Examples

### Example 1: Daily Announcement

```typescript
{
  type: 'CreateCast',
  config: {
    text: 'Good morning Farcaster! 🌅 Today is going to be great!'
  }
}
```

### Example 2: Share Achievement

```typescript
{
  type: 'CreateCast',
  config: {
    text: 'Just achieved 1000 followers! Thanks for the support! 🎉',
    mediaUrls: ['https://imagedelivery.net/.../achievement-badge/original']
  }
}
```

### Example 3: Multi-Step Workflow

```typescript
[
  {
    type: 'UpdateWallet',
    config: {},
    order: 0
  },
  {
    type: 'Delay',
    config: { delayMs: 1000 },
    order: 1
  },
  {
    type: 'CreateCast',
    config: {
      text: 'Wallet updated and ready to go! 💪'
    },
    order: 2
  }
]
```

## 🎬 Run Examples

```bash
# Show all examples
npx ts-node scripts/examples/createCastExample.ts

# Run specific examples
npx ts-node scripts/examples/createCastExample.ts 1
npx ts-node scripts/examples/createCastExample.ts 1 2 3
```

## 📚 Available Examples

1. **Text-Only Cast** - Simple text post
2. **Cast with Media** - Single image attachment
3. **Multiple Media** - Multiple image attachments
4. **Complex Script** - Multiple actions in sequence
5. **Looped Script** - Create multiple casts
6. **Multi-Account** - Execute on multiple accounts

## ⚙️ Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `text` | string | Yes | - | Cast content |
| `mediaUrls` | string[] | No | [] | Media URLs to embed |

## 🔐 Token Management

- Use encrypted tokens (system handles decryption)
- Tokens must have cast creation permissions
- Tokens are rate-limited (5 requests/second)

## 📊 Response Format

```json
{
  "result": {
    "cast": {
      "hash": "0x1234567890abcdef",
      "text": "Your cast text",
      "embeds": [
        {
          "url": "https://imagedelivery.net/.../image/original"
        }
      ]
    }
  }
}
```

## 🚦 Rate Limits

- **5 requests per second** per token
- **Automatic retry** with exponential backoff
- **3 maximum attempts** per request

## 💡 Tips

1. **Use delays** between casts to avoid rate limits
2. **Test with text-only** first before adding media
3. **Compress images** to reduce upload time
4. **Use idempotency keys** to prevent duplicates
5. **Monitor logs** for debugging

## 🔗 Related Documentation

- Full documentation: `CREATE_CAST_ACTION.md`
- Implementation details: `CREATE_CAST_IMPLEMENTATION_SUMMARY.md`
- Examples: `scripts/examples/createCastExample.ts`
- Script guide: `SCRIPT_LOOPS.md`

## 🆘 Need Help?

1. Check the full documentation: `CREATE_CAST_ACTION.md`
2. Review examples: `scripts/examples/createCastExample.ts`
3. Check logs for error details
4. Verify token and account ID are correct

## 🎉 You're Ready!

You now have everything needed to create automated casts on Farcaster. Start with a simple text-only cast and gradually add media and complexity!

Happy casting! 🚀

