import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      include: { member: { include: { subscriptions: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.method === 'GET') {
      // Get user profile and settings
      const activeSubscription = user.member?.subscriptions?.find(s => s.status === 'ACTIVE');
      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        interests: user.interests,
        membershipTier: user.member?.membershipTier || 'Free',
        subscriptionStatus: activeSubscription?.status || 'inactive',
        subscriptionTier: activeSubscription?.tier,
        currentPeriodEnd: activeSubscription?.currentPeriodEnd,
        jobTitle: user.jobTitle,
        website: user.website,
        socialTwitter: user.socialTwitter,
        socialLinkedin: user.socialLinkedin,
        socialFacebook: user.socialFacebook,
      });
    }

    if (req.method === 'PATCH') {
      // Update user profile
      const {
        name,
        bio,
        avatar,
        interests,
        jobTitle,
        website,
        socialTwitter,
        socialLinkedin,
        socialFacebook,
      } = req.body;

      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(bio !== undefined && { bio }),
          ...(avatar !== undefined && { avatar }),
          ...(interests !== undefined && { interests }),
          ...(jobTitle !== undefined && { jobTitle }),
          ...(website !== undefined && { website }),
          ...(socialTwitter !== undefined && { socialTwitter }),
          ...(socialLinkedin !== undefined && { socialLinkedin }),
          ...(socialFacebook !== undefined && { socialFacebook }),
        },
      });

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          bio: updatedUser.bio,
          avatar: updatedUser.avatar,
          interests: updatedUser.interests,
        },
      });
    }

    if (req.method === 'PUT') {
      // Update password
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.users.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return res.status(200).json({ message: 'Password updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
