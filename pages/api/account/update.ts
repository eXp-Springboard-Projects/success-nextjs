import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = supabaseAdmin();
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if email is already taken by another user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .neq('id', session.user.id)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        name,
        email: email.toLowerCase(),
      })
      .eq('id', session.user.id)
      .select('id, name, email')
      .single();

    if (updateError) throw updateError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: randomUUID(),
        user_id: session.user.id,
        action: 'UPDATE',
        entity: 'user',
        entity_id: session.user.id,
        details: JSON.stringify({ fields: ['name', 'email'] }),
      });

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update account' });
  }
}
