/**
 * API Endpoint: /api/admin/staff/[id]
 * Methods: GET, PUT, DELETE
 * Description: Manage individual staff member
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

  // Only SUPER_ADMIN and ADMIN can manage staff
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid staff ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getStaffMember(id, res);
      case 'PUT':
        return await updateStaffMember(id, req, res, session);
      case 'DELETE':
        return await deactivateStaffMember(id, res, session);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function getStaffMember(id: string, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, name, email, role, emailVerified, createdAt, lastLoginAt, bio, avatar,
      posts:posts(count)
    `)
    .eq('id', id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  // Get departments
  const { data: departments } = await supabase
    .from('staff_departments')
    .select('department')
    .eq('userId', id);

  return res.status(200).json({
    ...user,
    postsCount: user.posts?.[0]?.count || 0,
    departments: (departments || []).map((d: { department: string }) => d.department),
  });
}

async function updateStaffMember(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  const { name, email, role, bio, avatar } = req.body;

  // Validate required fields
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const supabase = supabaseAdmin();

  // Only SUPER_ADMIN can change roles to/from SUPER_ADMIN
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .single();

  if (
    (currentUser?.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') &&
    session.user.role !== 'SUPER_ADMIN'
  ) {
    return res.status(403).json({
      error: 'Only Super Admins can modify Super Admin roles',
    });
  }

  // Update user
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      name,
      email,
      role,
      bio: bio || null,
      avatar: avatar || null,
    })
    .eq('id', id)
    .select('id, name, email, role, bio, avatar')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update staff member' });
  }

  return res.status(200).json({
    message: 'Staff member updated successfully',
    user: updatedUser,
  });
}

async function deactivateStaffMember(
  id: string,
  res: NextApiResponse,
  session: any
) {
  // Only SUPER_ADMIN can delete staff
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Only Super Admins can delete staff members',
    });
  }

  const supabase = supabaseAdmin();

  // Check if trying to delete a SUPER_ADMIN
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', id)
    .single();

  if (fetchError || !user) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  // Prevent self-deletion
  if (id === session.user.id) {
    return res.status(400).json({
      error: 'Cannot delete your own account',
    });
  }

  // Delete the staff member (CASCADE will handle related records)
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(500).json({ error: 'Failed to delete staff member' });
  }

  return res.status(200).json({
    message: 'Staff member deleted successfully',
    deletedEmail: user.email,
  });
}
