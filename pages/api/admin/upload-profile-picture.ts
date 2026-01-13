import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // DELETE - Remove profile picture
  if (req.method === 'DELETE') {
    try {
      const supabase = supabaseAdmin();

      // Update user record to remove image
      const { error } = await supabase
        .from('users')
        .update({ image: null })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error removing profile picture:', error);
        return res.status(500).json({ error: 'Failed to remove profile picture' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST - Upload profile picture
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.originalFilename || file.newFilename);
    const filename = `${session.user.id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Move file from temp location to uploads directory
    await fs.copyFile(file.filepath, filepath);
    await fs.unlink(file.filepath); // Clean up temp file

    // Generate public URL
    const imageUrl = `/uploads/avatars/${filename}`;

    // Update user record in database
    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from('users')
      .update({ image: imageUrl })
      .eq('id', session.user.id);

    if (error) {
      // Clean up uploaded file if database update fails
      await fs.unlink(filepath).catch(() => {});
      console.error('Error updating user profile:', error);
      return res.status(500).json({ error: 'Failed to update profile picture' });
    }

    return res.status(200).json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
}
