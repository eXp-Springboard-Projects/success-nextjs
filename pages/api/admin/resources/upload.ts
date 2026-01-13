import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const title = fields.title?.[0];
    const description = fields.description?.[0];
    const category = fields.category?.[0];
    const thumbnail = fields.thumbnail?.[0];

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Read file
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileName = `${Date.now()}-${file.originalFilename}`;
    const fileExt = path.extname(file.originalFilename || '').slice(1);

    // Upload to Supabase Storage
    const supabase = supabaseAdmin();

    // Check if resources bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const resourcesBucket = buckets?.find(b => b.name === 'resources');

    if (!resourcesBucket) {
      console.log('Resources bucket not found, creating...');
      const { data: newBucket, error: bucketError } = await supabase.storage.createBucket('resources', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });

      if (bucketError) {
        console.error('Failed to create resources bucket:', bucketError);
        return res.status(500).json({
          message: 'Storage bucket does not exist and could not be created',
          error: bucketError.message,
          details: 'Please create the "resources" bucket manually in Supabase Storage Dashboard'
        });
      }
    }

    // Try to upload to resources bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      console.error('Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        fileName,
        fileSize: file.size,
        mimeType: file.mimetype
      });
      return res.status(500).json({
        message: 'Failed to upload file to storage',
        error: uploadError.message,
        details: `Upload failed: ${uploadError.message}`
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resources')
      .getPublicUrl(fileName);

    // Create resource record
    const { data: resource, error: dbError } = await supabase
      .from('resources')
      .insert({
        title,
        description,
        category,
        fileUrl: urlData.publicUrl,
        fileType: fileExt,
        fileSize: file.size,
        thumbnail: thumbnail || null,
        downloads: 0,
        isActive: true,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('resources').remove([fileName]);
      throw dbError;
    }

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(201).json(resource);
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Failed to upload resource', error: error.message });
  }
}
