import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Local file storage fallback for development
 * Stores files in public/uploads directory
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface LocalUploadResult {
  url: string;
  filename: string;
  size: number;
  path: string;
}

/**
 * Save file to local uploads directory
 */
export async function saveFileLocally(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<LocalUploadResult> {
  const ext = path.extname(originalFilename) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Write file
  fs.writeFileSync(filepath, buffer);

  return {
    url: `/uploads/${filename}`,
    filename: originalFilename,
    size: buffer.length,
    path: filepath,
  };
}

/**
 * Delete file from local uploads directory
 */
export async function deleteFileLocally(url: string): Promise<void> {
  const filename = path.basename(url);
  const filepath = path.join(UPLOAD_DIR, filename);

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

/**
 * Check if we should use local storage
 */
export function shouldUseLocalStorage(): boolean {
  return !process.env.BLOB_READ_WRITE_TOKEN ||
         process.env.BLOB_READ_WRITE_TOKEN.includes('placeholder');
}
