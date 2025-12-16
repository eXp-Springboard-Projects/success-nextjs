import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid campaign ID' });
  }

  if (req.method === 'GET') {
    return getCampaign(id, res);
  } else if (req.method === 'PATCH') {
    return updateCampaign(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteCampaign(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCampaign(id: string, res: NextApiResponse) {
  try {
    const campaign = await prisma.$queryRaw<Array<any>>`
      SELECT
        c.*,
        t.name as template_name,
        t.html_content as template_html,
        l.name as list_name
      FROM email_campaigns c
      LEFT JOIN email_templates t ON c.template_id = t.id
      LEFT JOIN contact_lists l ON c.list_id = l.id
      WHERE c.id = ${id}
    `;

    if (campaign.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.status(200).json(campaign[0]);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return res.status(500).json({ error: 'Failed to fetch campaign' });
  }
}

async function updateCampaign(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      name,
      subject,
      previewText,
      templateId,
      listId,
      segmentFilters,
      fromEmail,
      fromName,
      status,
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex}`);
      params.push(subject);
      paramIndex++;
    }

    if (previewText !== undefined) {
      updates.push(`preview_text = $${paramIndex}`);
      params.push(previewText);
      paramIndex++;
    }

    if (templateId !== undefined) {
      updates.push(`template_id = $${paramIndex}`);
      params.push(templateId);
      paramIndex++;
    }

    if (listId !== undefined) {
      updates.push(`list_id = $${paramIndex}`);
      params.push(listId);
      paramIndex++;
    }

    if (segmentFilters !== undefined) {
      updates.push(`segment_filters = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(segmentFilters));
      paramIndex++;
    }

    if (fromEmail !== undefined) {
      updates.push(`from_email = $${paramIndex}`);
      params.push(fromEmail);
      paramIndex++;
    }

    if (fromName !== undefined) {
      updates.push(`from_name = $${paramIndex}`);
      params.push(fromName);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      await prisma.$queryRawUnsafe(
        `UPDATE email_campaigns SET ${updates.join(', ')} WHERE id = $1`,
        ...params
      );
    }

    const campaign = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_campaigns WHERE id = ${id}
    `;

    return res.status(200).json(campaign[0]);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({ error: 'Failed to update campaign' });
  }
}

async function deleteCampaign(id: string, res: NextApiResponse) {
  try {
    await prisma.$executeRaw`
      DELETE FROM email_campaigns WHERE id = ${id}
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({ error: 'Failed to delete campaign' });
  }
}
