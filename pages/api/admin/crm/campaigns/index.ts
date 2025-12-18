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
    const { status = '' } = req.query;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const campaigns = await prisma.$queryRawUnsafe(`
      SELECT
        c.*,
        t.name as template_name,
        l.name as list_name
      FROM email_campaigns c
      LEFT JOIN email_templates t ON c.template_id = t.id
      LEFT JOIN contact_lists l ON c.list_id = l.id
      WHERE 1=1 ${whereClause}
      ORDER BY c.created_at DESC
    `, ...params);

    return res.status(200).json({ campaigns });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}

async function createCampaign(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      name,
      subject,
      previewText,
      templateId,
      listId,
      segmentFilters = {},
      fromEmail = 'noreply@success.com',
      fromName = 'SUCCESS Magazine',
    } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ error: 'Name and subject are required' });
    }

    const campaignId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO email_campaigns (
        id, name, subject, preview_text, template_id, list_id, segment_filters,
        from_email, from_name, status, created_by
      ) VALUES (
        ${campaignId}, ${name}, ${subject}, ${previewText || null},
        ${templateId || null}, ${listId || null}, ${JSON.stringify(segmentFilters)}::jsonb,
        ${fromEmail}, ${fromName}, 'draft', ${session.user.id}
      )
    `;

    const campaign = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_campaigns WHERE id = ${campaignId}
    `;

    return res.status(201).json(campaign[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
}
