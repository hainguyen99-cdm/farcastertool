/**
 * Media Upload Service for Farcaster
 * 
 * Implements the correct flow for uploading media to Farcaster:
 * 1. Call generate-image-upload-url to get upload URL
 * 2. Upload media file to the returned URL
 * 3. Return the media URL for use in cast
 */

export interface GenerateUploadUrlResponse {
  url: string;
  optimisticImageId: string;
}

export interface UploadMediaResponse {
  result?: {
    id: string;
    filename: string;
    uploaded: string;
    variants: string[];
  };
  success: boolean;
  errors: string[];
  messages: string[];
}

export interface MediaUploadResult {
  success: boolean;
  mediaUrl?: string;
  imageId?: string;
  error?: string;
}

/**
 * Step 1: Generate upload URL from Farcaster
 */
export async function generateImageUploadUrl(
  accountId: string
): Promise<GenerateUploadUrlResponse> {
  try {
    const response = await fetch('/api/scripts/generate-image-upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Step 2: Upload media file to the generated URL
 */
export async function uploadMediaFile(
  uploadUrl: string,
  file: File
): Promise<UploadMediaResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to upload media file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Step 3: Complete flow - generate URL, upload file, return media URL
 */
export async function uploadMediaToFarcaster(
  accountId: string,
  file: File
): Promise<MediaUploadResult> {
  try {
    // Step 1: Generate upload URL
    console.log('Step 1: Generating upload URL...');
    const uploadUrlResponse = await generateImageUploadUrl(accountId);
    const { url: uploadUrl, optimisticImageId } = uploadUrlResponse;

    // Step 2: Upload file to the generated URL
    console.log('Step 2: Uploading media file...');
    const uploadResponse = await uploadMediaFile(uploadUrl, file);

    if (!uploadResponse.success) {
      throw new Error(
        `Upload failed: ${uploadResponse.errors?.join(', ') || 'Unknown error'}`
      );
    }

    // Step 3: Get the media URL from response
    const mediaUrl = uploadResponse.result?.variants?.[uploadResponse.result.variants.length - 1];
    if (!mediaUrl) {
      throw new Error('No media URL returned from upload');
    }

    console.log('Step 3: Media uploaded successfully');
    return {
      success: true,
      mediaUrl,
      imageId: uploadResponse.result?.id || optimisticImageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple media files
 */
export async function uploadMultipleMediaFiles(
  encryptedToken: string,
  files: File[]
): Promise<{ success: boolean; mediaUrls: string[]; errors: string[] }> {
  const mediaUrls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Uploading file ${i + 1}/${files.length}: ${file.name}`);

    const result = await uploadMediaToFarcaster(encryptedToken, file);

    if (result.success && result.mediaUrl) {
      mediaUrls.push(result.mediaUrl);
    } else {
      errors.push(`Failed to upload ${file.name}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    mediaUrls,
    errors,
  };
}

/**
 * Validate file before upload
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only images are supported.`,
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size is 10MB.`,
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateMediaFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length > 4) {
    errors.push(`Too many files: ${files.length}. Maximum 4 files allowed.`);
  }

  files.forEach((file, index) => {
    const validation = validateMediaFile(file);
    if (!validation.valid) {
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

