/**
 * API Endpoint: /api/admin/staff/delete-by-email
 * Method: POST
 * Description: Delete a user by email (SUPER_ADMIN only)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can delete users
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Super Admin access required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const supabase = supabaseAdmin();

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('email', email.toLowerCase())
      .single();

    if (findError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (user.email === session.user.email) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    return res.status(200).json({
      success: true,
      message: `User ${user.email} has been deleted`,
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
