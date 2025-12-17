import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { createInviteCode } from '../../../../lib/auth-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only ADMIN and SUPER_ADMIN can create invite codes
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can create invite codes' });
    }

    const { email, role, expiresInDays, maxUses, departments } = req.body;

    const invite = await createInviteCode({
      email: email || undefined,
      role: role || 'EDITOR',
      createdBy: session.user.id,
      expiresInDays: expiresInDays || 7,
      maxUses: maxUses || 1,
    });

    // TODO: Store departments with invite for future implementation
    // This would require updating the invite_codes table schema
    // For now, departments can be assigned manually after registration

    return res.status(201).json({
      success: true,
      invite: {
        code: invite.code,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        maxUses: invite.maxUses,
      },
      note: departments && departments.length > 0
        ? 'Departments will need to be assigned manually after user registration'
        : undefined,
    });

  } catch (error) {
    console.error('Create invite error:', error);
    return res.status(500).json({ error: 'Failed to create invite code' });
  }
}
