#!/usr/bin/env node

/**
 * Script to create a cast on Farcaster with optional media attachments.
 * 
 * This script demonstrates the complete flow:
 * 1. Generate an image upload URL via Farcaster API
 * 2. Upload media file to the generated URL
 * 3. Create a cast with the media URL as an embed
 * 
 * Usage:
 *   npx ts-node scripts/createCast.ts --token <encrypted_token> --text "Your cast text" --media <path_to_image>
 * 
 * Example:
 *   npx ts-node scripts/createCast.ts --token "abc123..." --text "I love Farcaster" --media ./image.png
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

interface CreateCastOptions {
  token: string;
  text: string;
  mediaPath?: string;
  baseUrl?: string;
}

interface GenerateUploadUrlResponse {
  url: string;
  optimisticImageId: string;
}

interface UploadMediaResponse {
  result: {
    id: string;
    filename: string;
    meta: {
      fid: number;
    };
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  success: boolean;
  errors: string[];
  messages: string[];
}

interface CreateCastResponse {
  result?: {
    cast: {
      hash: string;
      text: string;
      embeds?: Array<{ url: string }>;
    };
  };
  success?: boolean;
}

class FarcasterCastCreator {
  private baseUrl: string = 'https://client.farcaster.xyz';
  private token: string;

  constructor(token: string, baseUrl?: string) {
    this.token = token;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  /**
   * Build standard headers for Farcaster API requests
   */
  private buildHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'authorization': `Bearer ${this.token}`,
      'content-type': 'application/json; charset=utf-8',
      'fc-amplitude-device-id': 'J1mIpCCJ7U9nPLneVJVkYE',
      'fc-amplitude-session-id': '1765852985832',
      'idempotency-key': this.generateIdempotencyKey(),
      'origin': 'https://farcaster.xyz',
      'priority': 'u=1, i',
      'referer': 'https://farcaster.xyz/',
      'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      ...additionalHeaders,
    };
  }

  /**
   * Generate a unique idempotency key
   */
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Step 1: Generate an image upload URL
   */
  async generateImageUploadUrl(): Promise<GenerateUploadUrlResponse> {
    console.log('📋 Step 1: Generating image upload URL...');
    
    try {
      const response = await axios.post<GenerateUploadUrlResponse>(
        `${this.baseUrl}/v1/generate-image-upload-url`,
        {},
        {
          headers: this.buildHeaders({
            'sec-fetch-site': 'same-site',
          }),
        }
      );

      console.log('✅ Upload URL generated successfully');
      console.log(`   URL: ${response.data.url}`);
      console.log(`   Image ID: ${response.data.optimisticImageId}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to generate upload URL:', error);
      throw error;
    }
  }

  /**
   * Step 2: Upload media file to the generated URL
   */
  async uploadMediaFile(uploadUrl: string, mediaPath: string): Promise<UploadMediaResponse> {
    console.log(`\n📤 Step 2: Uploading media file: ${mediaPath}`);

    try {
      // Read the file
      if (!fs.existsSync(mediaPath)) {
        throw new Error(`File not found: ${mediaPath}`);
      }

      const fileBuffer = fs.readFileSync(mediaPath);
      const fileName = path.basename(mediaPath);
      const mimeType = this.getMimeType(mediaPath);

      console.log(`   File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`   MIME type: ${mimeType}`);

      // Create form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType,
      });

      // Upload to the provided URL
      const response = await axios.post<UploadMediaResponse>(
        uploadUrl,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'origin': 'https://farcaster.xyz',
            'priority': 'u=1, i',
            'referer': 'https://farcaster.xyz/',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          },
        }
      );

      console.log('✅ Media uploaded successfully');
      console.log(`   Image ID: ${response.data.result.id}`);
      console.log(`   Uploaded at: ${response.data.result.uploaded}`);
      console.log(`   Available variants: ${response.data.result.variants.length}`);

      return response.data;
    } catch (error) {
      console.error('❌ Failed to upload media:', error);
      throw error;
    }
  }

  /**
   * Step 3: Create a cast with optional media embeds
   */
  async createCast(text: string, mediaUrls?: string[]): Promise<CreateCastResponse> {
    console.log(`\n✍️  Step 3: Creating cast...`);
    console.log(`   Text: "${text}"`);
    if (mediaUrls && mediaUrls.length > 0) {
      console.log(`   Media embeds: ${mediaUrls.length}`);
      mediaUrls.forEach((url, idx) => {
        console.log(`     ${idx + 1}. ${url}`);
      });
    }

    try {
      const payload: Record<string, unknown> = { text };
      if (mediaUrls && mediaUrls.length > 0) {
        payload.embeds = mediaUrls;
      }

      const response = await axios.post<CreateCastResponse>(
        `${this.baseUrl}/v2/casts`,
        payload,
        {
          headers: this.buildHeaders({
            'sec-fetch-site': 'same-site',
          }),
        }
      );

      console.log('✅ Cast created successfully');
      if (response.data.result?.cast) {
        console.log(`   Cast hash: ${response.data.result.cast.hash}`);
        console.log(`   Text: "${response.data.result.cast.text}"`);
        if (response.data.result.cast.embeds) {
          console.log(`   Embeds: ${response.data.result.cast.embeds.length}`);
        }
      }

      return response.data;
    } catch (error) {
      console.error('❌ Failed to create cast:', error);
      throw error;
    }
  }

  /**
   * Complete flow: Generate URL -> Upload media -> Create cast
   */
  async createCastWithMedia(text: string, mediaPath: string): Promise<CreateCastResponse> {
    console.log('🚀 Starting cast creation with media...\n');

    try {
      // Step 1: Generate upload URL
      const uploadUrlData = await this.generateImageUploadUrl();

      // Step 2: Upload media
      const uploadResponse = await this.uploadMediaFile(uploadUrlData.url, mediaPath);

      // Get the media URL from the response
      // Use the 'original' variant or the first available variant
      const mediaUrl = uploadResponse.result.variants.find(v => v.includes('/original')) 
        || uploadResponse.result.variants[0];

      if (!mediaUrl) {
        throw new Error('No media URL available in upload response');
      }

      console.log(`\n📎 Media URL for embed: ${mediaUrl}`);

      // Step 3: Create cast with media
      const castResponse = await this.createCast(text, [mediaUrl]);

      console.log('\n✨ Cast creation complete!');
      return castResponse;
    } catch (error) {
      console.error('\n❌ Cast creation failed:', error);
      throw error;
    }
  }

  /**
   * Create cast with text only (no media)
   */
  async createTextOnlyCast(text: string): Promise<CreateCastResponse> {
    console.log('🚀 Starting text-only cast creation...\n');

    try {
      const castResponse = await this.createCast(text);
      console.log('\n✨ Cast creation complete!');
      return castResponse;
    } catch (error) {
      console.error('\n❌ Cast creation failed:', error);
      throw error;
    }
  }

  /**
   * Determine MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): CreateCastOptions {
  const args = process.argv.slice(2);
  const options: Partial<CreateCastOptions> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      options.token = args[i + 1];
      i++;
    } else if (args[i] === '--text' && args[i + 1]) {
      options.text = args[i + 1];
      i++;
    } else if (args[i] === '--media' && args[i + 1]) {
      options.mediaPath = args[i + 1];
      i++;
    } else if (args[i] === '--base-url' && args[i + 1]) {
      options.baseUrl = args[i + 1];
      i++;
    }
  }

  if (!options.token) {
    throw new Error('Missing required argument: --token');
  }
  if (!options.text) {
    throw new Error('Missing required argument: --text');
  }

  return options as CreateCastOptions;
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();
    const creator = new FarcasterCastCreator(options.token, options.baseUrl);

    let result: CreateCastResponse;

    if (options.mediaPath) {
      result = await creator.createCastWithMedia(options.text, options.mediaPath);
    } else {
      result = await creator.createTextOnlyCast(options.text);
    }

    console.log('\n📊 Final Result:');
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', (error as any)?.message ?? error);
    process.exit(1);
  }
}

main();

