# CreateCast Script Action Guide

## Overview

The **CreateCast** action allows you to programmatically create casts (posts) on Farcaster with text content and embedded media URLs. This action is perfect for automating content distribution, testing, or running engagement campaigns.

## Features

- ✅ Create casts with custom text content
- ✅ Embed multiple images/media URLs (up to 4 per cast)
- ✅ Support for direct URLs or Cloudflare Image Delivery
- ✅ Automatic validation of cast content
- ✅ Rate limiting and retry logic
- ✅ Full error handling and logging

## Configuration

### Text Content
- **Field**: Cast Text
- **Required**: Yes
- **Max Length**: 300 characters
- **Description**: The main text content of your cast

### Embed URLs
- **Field**: Embed URLs (one per line)
- **Required**: No
- **Max URLs**: 4 per cast
- **Format**: Full URLs starting with `http://` or `https://`
- **Description**: URLs of images or media to embed in the cast

### Upload Method
- **Field**: Upload Method
- **Options**: 
  - `Cloudflare Image Delivery` (default) - Recommended for media files
  - `Direct URL` - For direct image URLs
- **Description**: How to handle media uploads

### Media Files
- **Field**: Upload Media Files
- **Type**: Image files (jpg, png, gif, etc.)
- **Max Files**: 4 per cast
- **Description**: Local image files to upload and embed

## Usage Examples

### Simple Text Cast
```
Text: "Just testing the new CreateCast action! 🚀"
Embeds: (empty)
```

### Cast with Image URLs
```
Text: "Check out this amazing image!"
Embeds:
https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e60570cf-4555-438c-4463-59f997f4c300/original
```

### Cast with Multiple Embeds
```
Text: "Here's a collection of images"
Embeds:
https://example.com/image1.png
https://example.com/image2.png
https://example.com/image3.png
```

## API Integration

### Frontend Flow
1. User configures CreateCast action in the script builder
2. User selects accounts and executes the script
3. Frontend sends request to `/api/scripts/create-cast`
4. Backend processes the cast creation

### Backend Flow
1. Receives cast configuration (text + embeds)
2. Validates content (length, URL format, etc.)
3. Calls Farcaster API `/v2/casts` endpoint
4. Returns cast creation result

### Farcaster API Endpoint
```
POST https://client.farcaster.xyz/v2/casts
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Your cast text here",
  "embeds": [
    { "url": "https://example.com/image1.png" },
    { "url": "https://example.com/image2.png" }
  ]
}
```

## Validation Rules

### Text Validation
- ✅ Required (cannot be empty)
- ✅ Maximum 300 characters
- ✅ Trimmed of leading/trailing whitespace

### Embed Validation
- ✅ Maximum 4 embeds per cast
- ✅ Must be valid URLs (http:// or https://)
- ✅ One URL per line in the textarea

### Rate Limiting
- ✅ Rate limited to 5 requests per second per account
- ✅ Automatic retry with exponential backoff (up to 3 attempts)
- ✅ 300ms initial backoff, max 5000ms

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Cast text is required" | Empty text field | Add text content to your cast |
| "Cast text must be 300 characters or less" | Text too long | Reduce text length |
| "Maximum 4 embeds allowed per cast" | Too many URLs | Remove some embed URLs |
| "Invalid URL" | Malformed URL | Check URL format (must start with http:// or https://) |
| "Failed to create cast" | Farcaster API error | Check account permissions and try again |

## Advanced Configuration

### Media Upload Process

When using Cloudflare Image Delivery:

1. **Generate Upload URL**
   ```
   POST https://client.farcaster.xyz/v1/generate-image-upload-url
   Authorization: Bearer {token}
   ```

2. **Upload Media**
   ```
   PUT {upload_url}
   Content-Type: multipart/form-data
   file: {image_file}
   ```

3. **Get Media URL**
   - Response includes `variants` array with different image sizes
   - Use `original` variant for full resolution

4. **Create Cast with Media URL**
   ```
   POST https://client.farcaster.xyz/v2/casts
   Authorization: Bearer {token}
   {
     "text": "Your text",
     "embeds": [{ "url": "{media_url}" }]
   }
   ```

## Best Practices

### Content Guidelines
- ✅ Keep text concise and engaging
- ✅ Use clear, descriptive URLs
- ✅ Test with a single account first
- ✅ Monitor cast performance

### Performance Tips
- ✅ Batch multiple casts using loops
- ✅ Add delays between casts to avoid rate limiting
- ✅ Use shuffle to randomize cast order
- ✅ Monitor logs for failures

### Security
- ✅ Never hardcode sensitive information in cast text
- ✅ Use environment variables for API keys
- ✅ Validate all user input
- ✅ Encrypt stored tokens

## Troubleshooting

### Cast Not Creating
1. Check account has valid Farcaster token
2. Verify text content is not empty
3. Ensure URLs are properly formatted
4. Check rate limiting (wait a moment and retry)

### Media Not Embedding
1. Verify URLs are accessible
2. Check URL format (must be http:// or https://)
3. Ensure image files are valid
4. Try with direct URL first

### Script Execution Fails
1. Check account is properly configured
2. Review logs for specific error messages
3. Verify network connectivity
4. Try with simpler cast configuration

## Related Actions

- **GetFeed**: Retrieve feed data before creating casts
- **Delay**: Add delays between cast creation
- **UpdateWallet**: Ensure account is properly configured
- **FollowUser**: Follow users before creating related casts

## API Reference

### CreateCast Configuration Schema

```typescript
interface CreateCastConfig {
  text: string;              // Required: Cast text (max 300 chars)
  embedUrls?: string;        // Optional: URLs separated by newlines
  mediaFiles?: Array<{       // Optional: Local files to upload
    name: string;
    size: number;
    type: string;
  }>;
  uploadMethod?: 'imagedelivery' | 'direct';  // Optional: Upload method
}
```

### Response Schema

```typescript
interface CreateCastResponse {
  success: boolean;
  result?: {
    cast?: {
      hash: string;
      text: string;
      embeds: Array<{ url: string }>;
      timestamp: number;
    };
  };
  error?: string;
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review script logs for detailed error messages
3. Verify account configuration
4. Test with simpler cast configurations

## Version History

- **v1.0.0** (2025-12-16): Initial release
  - Basic cast creation with text
  - Support for embed URLs
  - Rate limiting and retry logic
  - Full error handling

