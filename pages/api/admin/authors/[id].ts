import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check role - only SUPER_ADMIN, ADMIN, and EDITOR can manage authors
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Author ID is required' });
  }

  const supabase = supabaseAdmin();

  // GET - Fetch single author
  if (req.method === 'GET') {
    try {
      const { data: author, error } = await supabase
        .from('authors')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !author) {
        return res.status(404).json({ error: 'Author not found' });
      }

      // Get article count for this author
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('customAuthorId', id)
        .eq('status', 'PUBLISHED');

      return res.status(200).json({
        ...author,
        articleCount: count || 0,
      });
    } catch (error: any) {
      console.error('Error fetching author:', error);
      return res.status(500).json({ error: 'Failed to fetch author', message: error.message });
    }
  }

  // PUT/PATCH - Update author
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { name, slug, bio, photo, email, title, socialLinkedin, socialTwitter, socialFacebook, website, isActive } = req.body;

      // Check if slug is being changed and if it's already taken
      if (slug) {
        const { data: existingAuthor } = await supabase
          .from('authors')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .single();

        if (existingAuthor) {
          return res.status(400).json({ error: 'An author with this slug already exists' });
        }
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (bio !== undefined) updateData.bio = bio;
      if (photo !== undefined) updateData.photo = photo;
      if (email !== undefined) updateData.email = email;
      if (title !== undefined) updateData.title = title;
      if (socialLinkedin !== undefined) updateData.socialLinkedin = socialLinkedin;
      if (socialTwitter !== undefined) updateData.socialTwitter = socialTwitter;
      if (socialFacebook !== undefined) updateData.socialFacebook = socialFacebook;
      if (website !== undefined) updateData.website = website;
      if (isActive !== undefined) updateData.isActive = isActive;

      const { data: author, error } = await supabase
        .from('authors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating author:', error);
        return res.status(500).json({ error: 'Failed to update author', message: error.message });
      }

      return res.status(200).json(author);
    } catch (error: any) {
      console.error('Error updating author:', error);
      return res.status(500).json({ error: 'Failed to update author', message: error.message });
    }
  }

  // DELETE - Delete author (soft delete by setting isActive = false)
  if (req.method === 'DELETE') {
    try {
      // Check if author has any articles
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('customAuthorId', id);

      if (count && count > 0) {
        // Soft delete - just mark as inactive
        const { error } = await supabase
          .from('authors')
          .update({ isActive: false, updatedAt: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          console.error('Error deleting author:', error);
          return res.status(500).json({ error: 'Failed to delete author', message: error.message });
        }

        return res.status(200).json({
          success: true,
          message: 'Author deactivated (has articles)',
          deactivated: true
        });
      } else {
        // No articles, can hard delete
        const { error } = await supabase
          .from('authors')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting author:', error);
          return res.status(500).json({ error: 'Failed to delete author', message: error.message });
        }

        return res.status(200).json({
          success: true,
          message: 'Author deleted permanently',
          deleted: true
        });
      }
    } catch (error: any) {
      console.error('Error deleting author:', error);
      return res.status(500).json({ error: 'Failed to delete author', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
