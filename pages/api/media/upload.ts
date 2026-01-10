import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { validateImageFile } from '../../../lib/media';
import { uploadImageToSupabase } from '../../../lib/mediaSupabase';
import formidable from 'formidable';
import fs from 'fs';
import { randomUUID } from 'crypto';

// Disable Next.js body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Media Upload] Request received:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    console.log('[Media Upload] Unauthorized - no session');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[Media Upload] User authenticated:', session.user.email);

  const supabase = supabaseAdmin();

  try {
    console.log('[Media Upload] Parsing form data...');
    // Parse form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      console.log('[Media Upload] No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[Media Upload] File received:', uploadedFile.originalFilename, uploadedFile.size, 'bytes');

    // 🔒 SECURITY: Validate file type and size
    const validation = validateImageFile({
      name: uploadedFile.originalFilename || 'upload.jpg',
      type: uploadedFile.mimetype || '',
      size: uploadedFile.size,
    }, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (!validation.valid) {
      fs.unlinkSync(uploadedFile.filepath); // Clean up temp file
      return res.status(400).json({ error: validation.error });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);

    let mediaUrl: string;
    let width: number;
    let height: number;
    let variants: any[] = [];

    try {
      // Upload to Supabase Storage with optimization and variants
      const optimized = await uploadImageToSupabase(
        fileBuffer,
        uploadedFile.originalFilename || 'upload.jpg',
        {
          generateVariants: true,
          maxWidth: 2000,
          quality: 80,
        }
      );

      mediaUrl = optimized.original;
      width = optimized.width;
      height = optimized.height;
      variants = optimized.variants;
    } catch (uploadError) {
      console.error('Supabase Storage upload failed:', uploadError);
      fs.unlinkSync(uploadedFile.filepath); // Clean up temp file
      return res.status(500).json({
        error: 'Failed to upload to storage',
        message: uploadError instanceof Error ? uploadError.message : 'Unknown upload error',
        details: uploadError instanceof Error ? uploadError.stack : undefined,
      });
    }

    // Save to database
    const mediaId = randomUUID();
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .insert({
        id: mediaId,
        filename: uploadedFile.originalFilename || 'upload.jpg',
        url: mediaUrl,
        mimeType: uploadedFile.mimetype || 'image/jpeg',
        size: uploadedFile.size,
        width,
        height,
        alt: (Array.isArray(fields.alt) ? fields.alt[0] : fields.alt) || '',
        caption: (Array.isArray(fields.caption) ? fields.caption[0] : fields.caption) || null,
        uploadedBy: session.user.id,
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Media database insert error:', mediaError);
      return res.status(500).json({
        error: 'Failed to save media to database',
        message: mediaError.message,
        details: mediaError.details,
        hint: mediaError.hint
      });
    }

    // Log activity (non-fatal if it fails)
    try {
      await supabase
        .from('activity_logs')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          action: 'UPLOAD',
          entity: 'media',
          entityId: media.id,
          details: JSON.stringify({
            filename: media.filename,
            size: media.size,
            variants: variants.length,
          }),
        });
    } catch (logError) {
      console.error('Failed to log activity (non-fatal):', logError);
    }

    // Clean up temp file
    fs.unlinkSync(uploadedFile.filepath);

    return res.status(201).json({
      id: media.id,
      url: media.url,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      width: media.width,
      height: media.height,
      alt: media.alt,
      createdAt: media.createdAt,
      variants,
    });
  } catch (error) {
    console.error('[Media Upload] Outer error:', error);
    return res.status(500).json({
      error: 'Failed to upload media',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
