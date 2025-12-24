import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        bio,
        avatar,
        interests,
        jobTitle,
        website,
        socialTwitter,
        socialLinkedin,
        socialFacebook,
        password,
        member:members (
          membershipTier,
          subscriptions (
            status,
            tier,
            currentPeriodEnd
          )
        )
      `)
      .eq('email', session.user.email!)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.method === 'GET') {
      // Get user profile and settings
      const activeSubscription = (user as any).member?.subscriptions?.find((s: any) => s.status === 'ACTIVE');
      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        interests: user.interests,
        membershipTier: (user as any).member?.membershipTier || 'Free',
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

      const updateData: any = {};
      if (name) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (interests !== undefined) updateData.interests = interests;
      if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
      if (website !== undefined) updateData.website = website;
      if (socialTwitter !== undefined) updateData.socialTwitter = socialTwitter;
      if (socialLinkedin !== undefined) updateData.socialLinkedin = socialLinkedin;
      if (socialFacebook !== undefined) updateData.socialFacebook = socialFacebook;

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

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
      const { error: passwordError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (passwordError) {
        throw passwordError;
      }

      return res.status(200).json({ message: 'Password updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Dashboard settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
