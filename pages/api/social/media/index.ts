/**
 * Media Library API
 * GET /api/social/media - List media
 * POST /api/social/media - Upload media
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';
import { MediaItem, ApiResponse } from '@/types/social';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<MediaItem[] | MediaItem>>
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.id || session.user.email!;

  if (req.method === 'GET') {
    return handleGet(userId, res);
  }

  if (req.method === 'POST') {
    return handlePost(userId, req, res);
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGet(
  userId: string,
  res: NextApiResponse<ApiResponse<MediaItem[]>>
) {
  try {
    const db = supabaseAdmin();

    const { data, error } = await db
      .from('social_media_library')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: (data || []) as MediaItem[],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}

async function handlePost(
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<MediaItem>>
) {
  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      uploadDir: '/tmp',
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Read file
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileName = file.originalFilename || 'upload';
    const fileType = file.mimetype || 'application/octet-stream';

    // Upload to Supabase Storage
    const db = supabaseAdmin();
    const filePath = `${userId}/${Date.now()}-${fileName}`;

    const { data: uploadData, error: uploadError } = await db.storage
      .from('social-media')
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = db.storage
      .from('social-media')
      .getPublicUrl(filePath);

    // Get image dimensions if it's an image
    let width = null;
    let height = null;

    // Save to database
    const altText = Array.isArray(fields.altText) ? fields.altText[0] : fields.altText;
    const tags = fields.tags
      ? (Array.isArray(fields.tags) ? fields.tags : fields.tags.split(','))
      : [];
    const folder = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder || 'general';

    const { data, error } = await db
      .from('social_media_library')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_type: fileType,
        file_size: file.size,
        width,
        height,
        alt_text: altText || null,
        tags,
        folder,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(201).json({
      success: true,
      data: data as MediaItem,
      message: 'Media uploaded successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}
