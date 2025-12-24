import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can approve staff
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { role = 'EDITOR', department } = req.body;

    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate department
    const validDepartments = [
      'SUPER_ADMIN',
      'CUSTOMER_SERVICE',
      'EDITORIAL',
      'SUCCESS_PLUS',
      'DEV',
      'MARKETING',
      'COACHING',
    ];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({ error: 'Invalid department' });
    }

    const supabase = supabaseAdmin();

    // Check if user exists and is pending
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id as string)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'PENDING') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    // Update user role and department
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: role,
        primary_department: department,
        updated_at: new Date().toISOString()
      })
      .eq('id', id as string);

    if (updateError) throw updateError;

    // TODO: Send approval email to user

    return res.status(200).json({ message: 'User approved successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to approve user' });
  }
}
