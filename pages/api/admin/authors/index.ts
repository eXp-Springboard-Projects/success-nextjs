import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';
import { randomUUID } from 'crypto';

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

  const supabase = supabaseAdmin();

  // GET - Fetch all authors
  if (req.method === 'GET') {
    try {
      const { search, active } = req.query;

      let query = supabase
        .from('authors')
        .select('*')
        .order('name', { ascending: true });

      // Filter by active status if specified
      if (active !== undefined) {
        query = query.eq('isActive', active === 'true');
      }

      // Search by name if specified
      if (search && typeof search === 'string') {
        query = query.ilike('name', `%${search}%`);
      }

      const { data: authors, error } = await query;

      if (error) {
        console.error('Error fetching authors:', error);
        return res.status(500).json({ error: 'Failed to fetch authors' });
      }

      return res.status(200).json(authors || []);
    } catch (error: any) {
      console.error('Error fetching authors:', error);
      return res.status(500).json({ error: 'Failed to fetch authors', message: error.message });
    }
  }

  // POST - Create new author
  if (req.method === 'POST') {
    try {
      const { name, slug, bio, photo, email, title, socialLinkedin, socialTwitter, socialFacebook, website } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      // Check if slug already exists
      const { data: existingAuthor } = await supabase
        .from('authors')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingAuthor) {
        return res.status(400).json({ error: 'An author with this slug already exists' });
      }

      const newAuthor = {
        id: randomUUID(),
        name,
        slug,
        bio: bio || null,
        photo: photo || null,
        email: email || null,
        title: title || null,
        socialLinkedin: socialLinkedin || null,
        socialTwitter: socialTwitter || null,
        socialFacebook: socialFacebook || null,
        website: website || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: author, error } = await supabase
        .from('authors')
        .insert(newAuthor)
        .select()
        .single();

      if (error) {
        console.error('Error creating author:', error);
        return res.status(500).json({ error: 'Failed to create author', message: error.message });
      }

      return res.status(201).json(author);
    } catch (error: any) {
      console.error('Error creating author:', error);
      return res.status(500).json({ error: 'Failed to create author', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
