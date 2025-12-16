/**
 * CreateCast Action Handler
 * 
 * This utility handles the CreateCast action which:
 * 1. Uploads media files to Farcaster's image delivery service
 * 2. Creates a cast with text and embedded media URLs
 */

export interface CreateCastConfig {
  text: string;
  embedUrls?: string;
  mediaFiles?: Array<{ name: string; size: number; type: string }>;
  uploadMethod?: 'imagedelivery' | 'direct';
}

export interface CreateCastPayload {
  accountId: string;
  text: string;
  embeds: string[];
  uploadMethod?: 'imagedelivery' | 'direct';
}

/**
 * Parse embed URLs from the textarea input
 */
export function parseEmbedUrls(embedUrlsText: string): string[] {
  return embedUrlsText
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));
}

/**
 * Prepare the CreateCast payload for the backend
 */
export function prepareCreateCastPayload(
  accountId: string,
  config: CreateCastConfig
): CreateCastPayload {
  const embeds = parseEmbedUrls(config.embedUrls || '');
  
  return {
    accountId,
    text: config.text,
    embeds,
    uploadMethod: config.uploadMethod || 'imagedelivery',
  };
}

/**
 * Execute the CreateCast action with media upload support
 */
export async function executeCreateCast(
  accountId: string,
  config: CreateCastConfig,
  encryptedToken?: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    if (!config.text || config.text.trim().length === 0) {
      return {
        success: false,
        error: 'Cast text is required',
      };
    }

    let embeds = parseEmbedUrls(config.embedUrls || '');

    // Handle media file uploads if present
    if (Array.isArray(config.mediaFiles) && config.mediaFiles.length > 0 && encryptedToken) {
      // Import media upload service dynamically to avoid circular dependencies
      const { uploadMultipleMediaFiles } = await import('./media-upload-service');
      
      // Get actual File objects from mediaFiles
      const files = (config.mediaFiles as any[])
        .filter(f => f.file instanceof File)
        .map(f => f.file as File);

      if (files.length > 0) {
        console.log(`Uploading ${files.length} media files...`);
        const uploadResult = await uploadMultipleMediaFiles(encryptedToken, files);

        if (!uploadResult.success) {
          return {
            success: false,
            error: `Media upload failed: ${uploadResult.errors.join(', ')}`,
          };
        }

        // Add uploaded media URLs to embeds
        embeds = [...embeds, ...uploadResult.mediaUrls];
      }
    }

    // Prepare payload with final embeds (both direct URLs and uploaded media)
    const payload = {
      accountId,
      text: config.text,
      embeds,
      uploadMethod: config.uploadMethod || 'imagedelivery',
    };

    const response = await fetch('/api/scripts/create-cast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate CreateCast configuration
 */
export function validateCreateCastConfig(config: CreateCastConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.text || config.text.trim().length === 0) {
    errors.push('Cast text is required');
  }

  if (config.text && config.text.length > 300) {
    errors.push('Cast text must be 300 characters or less');
  }

  if (config.embedUrls) {
    const urls = parseEmbedUrls(config.embedUrls);
    if (urls.length > 4) {
      errors.push('Maximum 4 embeds allowed per cast');
    }

    urls.forEach((url, index) => {
      try {
        new URL(url);
      } catch {
        errors.push(`Invalid URL at line ${index + 1}: ${url}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

