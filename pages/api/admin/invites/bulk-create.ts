import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { createInviteCode } from '../../../../lib/auth-utils';
import { sendInviteCodeEmail } from '../../../../lib/resend-email';
import { prisma } from '../../../../lib/prisma';

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

    // Only ADMIN and SUPER_ADMIN can create bulk invites
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can create invite codes' });
    }

    const { emails, role = 'EDITOR', expiresInDays = 30, sendEmails = true } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails array is required' });
    }

    // Filter out emails that already have accounts
    const existingUsers = await prisma.users.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: { email: true },
    });

    const existingEmails = existingUsers.map(u => u.email);
    const newEmails = emails.filter(email => !existingEmails.includes(email));

    if (newEmails.length === 0) {
      return res.status(400).json({
        error: 'All provided emails already have accounts',
        existingEmails,
      });
    }

    const results = {
      success: [] as { email: string; code: string; emailSent: boolean }[],
      failed: [] as { email: string; error: string }[],
      skipped: existingEmails,
    };

    const invitedByName = session.user.name || 'Admin';

    // Create invites for each email
    for (const email of newEmails) {
      try {
        // Create invite code
        const invite = await createInviteCode({
          email,
          role: role || 'EDITOR',
          createdBy: session.user.id,
          expiresInDays: expiresInDays || 30,
          maxUses: 1,
        });

        let emailSent = false;

        // Send email if requested
        if (sendEmails) {
          const emailResult = await sendInviteCodeEmail(
            email,
            invite.code,
            invitedByName
          );
          emailSent = emailResult.success || false;
        }

        results.success.push({
          email,
          code: invite.code,
          emailSent,
        });

      } catch (error: any) {
        results.failed.push({
          email,
          error: error.message || 'Unknown error',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Created ${results.success.length} invites`,
      results,
    });

  } catch (error) {
    console.error('Bulk invite error:', error);
    return res.status(500).json({ error: 'Failed to create invites' });
  }
}
