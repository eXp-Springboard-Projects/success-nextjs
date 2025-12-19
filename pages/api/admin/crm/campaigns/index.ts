import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getCampaigns(req, res);
  } else if (req.method === 'POST') {
    return createCampaign(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCampaigns(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status: statusFilter = '' } = req.query;

    const whereClause: any = {};

    if (statusFilter && statusFilter !== 'all') {
      whereClause.status = statusFilter.toString().toUpperCase();
    }

    const campaigns = await prisma.campaigns.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        sentCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        failedCount: true,
        deliveredCount: true,
        createdAt: true,
        sentAt: true,
        scheduledAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}

async function createCampaign(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      name,
      subject,
      scheduledAt,
    } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ error: 'Name and subject are required' });
    }

    const campaign = await prisma.campaigns.create({
      data: {
        id: nanoid(),
        name,
        subject,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sentCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        failedCount: 0,
        deliveredCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
}
