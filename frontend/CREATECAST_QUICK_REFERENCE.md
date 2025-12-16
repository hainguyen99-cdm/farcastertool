# CreateCast Action - Quick Reference

## What is CreateCast?
A script action that creates new casts (posts) on Farcaster with text and optional embedded media URLs.

## Quick Start

### 1. Create a Script
- Go to http://localhost:3000/scripts
- Click "Create Script"
- Name your script (e.g., "My First Cast")

### 2. Add CreateCast Action
- Click "Add Action"
- Select "CreateCast" from dropdown
- Click "Add"

### 3. Configure the Action
```
Cast Text: "Hello Farcaster! [object Object]
Embed URLs: (leave empty or add URLs)
Upload Method: Cloudflare Image Delivery
```

### 4. Execute
- Select accounts to run on
- Click "Execute Script on X Account(s)"
- Monitor the action status

## Configuration Fields

| Field | Type | Required | Max Length | Notes |
|-------|------|----------|-----------|-------|
| Cast Text | textarea | ✅ Yes | 300 chars | Main content of the cast |
| Embed URLs | textarea | ❌ No | 4 URLs | One URL per line |
| Upload Method | select | ❌ No | - | Default: Cloudflare Image Delivery |
| Media Files | file input | ❌ No | 4 files | For local image uploads |

## Usage Examples

### Example 1: Simple Text Cast
```
Text: "Just testing the CreateCast action! 🎉"
Embeds: (empty)
```

### Example 2: Cast with Image
```
Text: "Check out this amazing image!"
Embeds: https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original
```

### Example 3: Cast with Multiple Images
```
Text: "Here's a collection of images"
Embeds:
https://example.com/image1.png
https://example.com/image2.png
https://example.com/image3.png
```

### Example 4: Using in a Loop
```
Script: "Daily Cast Campaign"
Actions:
  1. CreateCast (Text: "Day 1 post")
  2. Delay (5000ms)
  3. CreateCast (Text: "Day 2 post")
  4. Delay (5000ms)
  5. CreateCast (Text: "Day 3 post")

Loop: 1
Shuffle: false
```

## Validation Rules

### Text
- ✅ Required (cannot be empty)
- ✅ Max 300 characters
- ✅ Whitespace trimmed

### Embed URLs
- ✅ Max 4 URLs per cast
- ✅ Must start with `http://` or `https://`
- ✅ One URL per line
- ✅ Empty lines ignored

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Cast text is required" | Add text to your cast |
| "Cast text must be 300 characters or less" | Reduce text length |
| "Maximum 4 embeds allowed per cast" | Remove some URLs |
| "Invalid URL" | Check URL format (must start with http:// or https://) |
| "Failed to create cast" | Check account permissions, try again |

## API Endpoints

### Frontend
```
POST /api/scripts/create-cast
Content-Type: application/json

{
  "accountId": "account_id",
  "text": "Cast text",
  "embeds": ["url1", "url2"]
}
```

### Backend
```
POST https://client.farcaster.xyz/v2/casts
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Cast text",
  "embeds": [
    {"url": "url1"},
    {"url": "url2"}
  ]
}
```

## Rate Limiting
- **Limit**: 5 requests per second per account
- **Retry**: Automatic retry up to 3 times
- **Backoff**: Exponential (300ms → 600ms → 1200ms)

## Best Practices

✅ **DO**
- Keep text concise and engaging
- Test with one account first
- Use delays between multiple casts
- Monitor script execution logs
- Validate URLs before using

❌ **DON'T**
- Create duplicate casts
- Spam the same content repeatedly
- Use invalid URLs
- Exceed character limits
- Ignore rate limiting

## Troubleshooting

### Cast Not Creating?
1. Check account has valid Farcaster token
2. Verify text is not empty
3. Ensure URLs are properly formatted
4. Wait a moment and retry (rate limiting)

### Media Not Embedding?
1. Verify URLs are accessible
2. Check URL format (http:// or https://)
3. Try with fewer URLs
4. Check image file is valid

### Script Execution Fails?
1. Review error message in logs
2. Check account configuration
3. Verify network connectivity
4. Try with simpler configuration

## File Structure

```
Frontend:
├── app/scripts/
│   ├── components/script-builder.tsx (UI)
│   ├── utils/create-cast-handler.ts (Logic)
│   └── CREATE_CAST_GUIDE.md (User Guide)
├── app/api/scripts/create-cast/route.ts (API)
└── CREATECAST_QUICK_REFERENCE.md (This file)

Backend:
├── src/
│   ├── farcaster.service.ts (createCast method)
│   ├── action.processor.ts (CreateCast case)
│   └── scenario.schema.ts (ActionType enum)
└── IMPLEMENTATION_SUMMARY.md (Details)
```

## Key Methods

### Frontend
```typescript
// Parse URLs from textarea
parseEmbedUrls(embedUrlsText: string): string[]

// Prepare payload for backend
prepareCreateCastPayload(accountId: string, config: CreateCastConfig): CreateCastPayload

// Execute the action
executeCreateCast(accountId: string, config: CreateCastConfig): Promise<Result>

// Validate configuration
validateCreateCastConfig(config: CreateCastConfig): {valid: boolean, errors: string[]}
```

### Backend
```typescript
// Create cast on Farcaster
async createCast(encryptedToken: string, text: string, embeds: string[]): Promise<unknown>

// Process CreateCast action
case 'CreateCast': {
  // Extract config
  // Validate input
  // Call farcasterService.createCast()
  // Log result
}
```

## Testing Checklist

- [ ] Create cast with text only
- [ ] Create cast with single URL
- [ ] Create cast with multiple URLs
- [ ] Verify error on empty text
- [ ] Verify error on text > 300 chars
- [ ] Verify error on > 4 URLs
- [ ] Test with multiple accounts
- [ ] Test rate limiting
- [ ] Test retry logic
- [ ] Verify logs are created

## Performance Tips

1. **Batch Operations**: Use loops to create multiple casts
2. **Add Delays**: Use Delay action between casts (5-10 seconds)
3. **Monitor Logs**: Check execution logs for issues
4. **Test First**: Always test with one account first
5. **Shuffle**: Use shuffle for randomized execution order

## Related Actions

- **GetFeed**: Get feed data before creating casts
- **LikeCast**: Like casts related to your content
- **RecastCast**: Recast your own casts
- **Delay**: Add delays between actions
- **UpdateWallet**: Ensure account is configured

## Links

- [User Guide](./CREATE_CAST_GUIDE.md)
- [Implementation Details](./IMPLEMENTATION_SUMMARY.md)
- [Farcaster API Docs](https://docs.farcaster.xyz)
- [Script Builder](http://localhost:3000/scripts)

## Support

**Need help?**
1. Check error messages in script logs
2. Review this quick reference
3. Read the full user guide
4. Check Farcaster API documentation
5. Contact development team

## Version

- **Version**: 1.0.0
- **Released**: 2025-12-16
- **Status**: Production Ready

---

**Last Updated**: 2025-12-16

