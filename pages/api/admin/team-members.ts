import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only staff members can manage team members
  const user = await prisma.users.findUnique({
    where: { email: session.user.email as string },
  });

  if (!user || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role)) {
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
    const teamMembers = await prisma.team_members.findMany({
      orderBy: { displayOrder: 'asc' },
    });

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
    const { name, title, bio, image, linkedIn, displayOrder, isActive } = req.body;

    if (!name || !title || !bio || !image) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const teamMember = await prisma.team_members.create({
      data: {
        id: uuidv4(),
        name,
        title,
        bio,
        image,
        linkedIn: linkedIn || null,
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        userId,
        action: 'CREATE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: teamMember.id,
        details: `Created team member: ${name}`,
      },
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
    const { id, name, title, bio, image, linkedIn, displayOrder, isActive } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Team member ID is required' });
    }

    const teamMember = await prisma.team_members.update({
      where: { id },
      data: {
        name,
        title,
        bio,
        image,
        linkedIn,
        displayOrder,
        isActive,
      },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        userId,
        action: 'UPDATE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: teamMember.id,
        details: `Updated team member: ${name}`,
      },
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
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Team member ID is required' });
    }

    const teamMember = await prisma.team_members.findUnique({
      where: { id },
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    await prisma.team_members.delete({
      where: { id },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: uuidv4(),
        userId,
        action: 'DELETE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: id,
        details: `Deleted team member: ${teamMember.name}`,
      },
    });

    return res.status(200).json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return res.status(500).json({ error: 'Failed to delete team member' });
  }
}
