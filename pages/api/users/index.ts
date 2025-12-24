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

  if (req.method === 'GET') {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          avatar,
          createdAt,
          lastLoginAt,
          memberId,
          members!inner(
            membershipTier,
            membershipStatus,
            totalSpent
          )
        `)
        .order('createdAt', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform member data to include membership tier
      const transformedUsers = users?.map((user: any) => ({
        ...user,
        membershipTier: user.members?.membershipTier || null,
        membershipStatus: user.members?.membershipStatus || null,
        totalSpent: user.members?.totalSpent || 0,
        members: undefined, // Remove the nested member object
      })) || [];

      return res.status(200).json(transformedUsers);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch users', message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, password, role, bio, avatar } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique ID
      const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id,
          name,
          email,
          password: hashedPassword,
          role: role || 'EDITOR',
          bio: bio || null,
          avatar: avatar || null,
          emailVerified: false,
          hasChangedDefaultPassword: false,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Don't return password
      const { password: _, ...userWithoutPassword } = newUser;

      return res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create user', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
