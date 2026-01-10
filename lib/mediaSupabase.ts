import { supabaseAdmin } from './supabase';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
  format: 'webp' | 'jpeg' | 'png';
  size: number;
}

export interface SupabaseUploadResult {
  original: string;
  variants: ImageVariant[];
  width: number;
  height: number;
}

const STORAGE_BUCKET = 'media';

/**
 * Upload and optimize an image to Supabase Storage
 * Creates multiple variants (thumbnail, medium, large) for responsive images
 */
export async function uploadImageToSupabase(
  file: Buffer,
  filename: string,
  options: {
    generateVariants?: boolean;
    maxWidth?: number;
    quality?: number;
  } = {}
): Promise<SupabaseUploadResult> {
  const supabase = supabaseAdmin();
  const {
    generateVariants = true,
    maxWidth = 2000,
    quality = 80,
  } = options;

  const variants: ImageVariant[] = [];

  // Get image metadata
  const metadata = await sharp(file).metadata();
  const originalFormat = metadata.format as 'jpeg' | 'png' | 'webp';

  // Generate unique filename
  const ext = filename.match(/\.[^.]+$/)?.[0] || '.jpg';
  const baseName = filename.replace(/\.[^/.]+$/, '');
  const uniqueId = randomUUID();

  // Resize original if needed
  let processedBuffer = file;
  let finalWidth = metadata.width || 0;
  let finalHeight = metadata.height || 0;

  if (metadata.width && metadata.width > maxWidth) {
    const resized = await sharp(file)
      .resize(maxWidth, null, { withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });

    processedBuffer = resized.data;
    finalWidth = resized.info.width;
    finalHeight = resized.info.height;
  }

  // Upload original
  const originalPath = `images/${uniqueId}${ext}`;
  const { data: originalData, error: originalError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(originalPath, processedBuffer, {
      contentType: `image/${originalFormat}`,
      cacheControl: '31536000', // 1 year
      upsert: false,
    });

  if (originalError) {
    throw new Error(`Failed to upload original: ${originalError.message}`);
  }

  // Get public URL for original
  const { data: { publicUrl: originalUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(originalPath);

  // Generate variants if requested
  if (generateVariants) {
    const variantSizes = [
      { name: 'large', width: 1200 },
      { name: 'medium', width: 800 },
      { name: 'small', width: 400 },
      { name: 'thumbnail', width: 200 },
    ];

    for (const size of variantSizes) {
      // Only generate if original is larger
      if (finalWidth > size.width) {
        try {
          // Generate WebP variant
          const webpBuffer = await sharp(processedBuffer)
            .resize(size.width, null, { withoutEnlargement: true })
            .webp({ quality })
            .toBuffer({ resolveWithObject: true });

          const variantPath = `images/${uniqueId}-${size.name}.webp`;

          const { error: variantError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(variantPath, webpBuffer.data, {
              contentType: 'image/webp',
              cacheControl: '31536000',
              upsert: false,
            });

          if (!variantError) {
            const { data: { publicUrl: variantUrl } } = supabase.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(variantPath);

            variants.push({
              url: variantUrl,
              width: webpBuffer.info.width,
              height: webpBuffer.info.height,
              format: 'webp',
              size: webpBuffer.data.length,
            });
          }
        } catch (err) {
          console.error(`Failed to create ${size.name} variant:`, err);
          // Continue with other variants
        }
      }
    }
  }

  return {
    original: originalUrl,
    variants,
    width: finalWidth,
    height: finalHeight,
  };
}

/**
 * Delete image and all its variants from Supabase Storage
 */
export async function deleteImageFromSupabase(url: string): Promise<void> {
  const supabase = supabaseAdmin();

  // Extract path from URL
  const urlObj = new URL(url);
  const path = urlObj.pathname.split('/').slice(-1)[0]; // Get filename

  if (!path) return;

  // Delete original
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([`images/${path}`]);

  if (error) {
    console.error('Failed to delete image:', error);
  }

  // Delete variants (best effort - don't throw if they don't exist)
  const baseName = path.replace(/\.[^.]+$/, '');
  const variantNames = ['large', 'medium', 'small', 'thumbnail'];

  for (const variant of variantNames) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([`images/${baseName}-${variant}.webp`]);
  }
}
