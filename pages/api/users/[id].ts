import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();
  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { name, email, password, role, bio, avatar } = req.body;

      const updateData: any = {
        name,
        email,
        role,
        bio: bio || null,
        avatar: avatar || null,
        updatedAt: new Date().toISOString(),
      };

      // Only update password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update user', message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Prevent deleting yourself
      if (id === session.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete user', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
