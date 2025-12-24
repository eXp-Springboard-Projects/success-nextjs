import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  // Only staff members can manage team members
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email as string)
    .single();

  if (!user || userError || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  switch (req.method) {
    case 'GET':
      return getTeamMembers(req, res);
    case 'POST':
      return createTeamMember(req, res, user.id);
    case 'PUT':
      return updateTeamMember(req, res, user.id);
    case 'DELETE':
      return deleteTeamMember(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTeamMembers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .order('displayOrder', { ascending: true });

    if (error) throw error;

    return res.status(200).json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
}

async function createTeamMember(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = supabaseAdmin();
    const { name, title, bio, image, linkedIn, displayOrder, isActive } = req.body;

    if (!name || !title || !bio || !image) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: teamMember, error: createError } = await supabase
      .from('team_members')
      .insert({
        id: uuidv4(),
        name,
        title,
        bio,
        image,
        linkedIn: linkedIn || null,
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: uuidv4(),
        userId,
        action: 'CREATE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: teamMember.id,
        details: `Created team member: ${name}`,
      });

    return res.status(201).json(teamMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    return res.status(500).json({ error: 'Failed to create team member' });
  }
}

async function updateTeamMember(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = supabaseAdmin();
    const { id, name, title, bio, image, linkedIn, displayOrder, isActive } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Team member ID is required' });
    }

    const { data: teamMember, error: updateError } = await supabase
      .from('team_members')
      .update({
        name,
        title,
        bio,
        image,
        linkedIn,
        displayOrder,
        isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: uuidv4(),
        userId,
        action: 'UPDATE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: teamMember.id,
        details: `Updated team member: ${name}`,
      });

    return res.status(200).json(teamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    return res.status(500).json({ error: 'Failed to update team member' });
  }
}

async function deleteTeamMember(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = supabaseAdmin();
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Team member ID is required' });
    }

    const { data: teamMember, error: findError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single();

    if (!teamMember || findError) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: uuidv4(),
        userId,
        action: 'DELETE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: id,
        details: `Deleted team member: ${teamMember.name}`,
      });

    return res.status(200).json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return res.status(500).json({ error: 'Failed to delete team member' });
  }
}
