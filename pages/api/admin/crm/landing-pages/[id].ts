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
    return res.status(400).json({ error: 'Invalid landing page ID' });
  }

  if (req.method === 'GET') {
    return getLandingPage(id, res);
  } else if (req.method === 'PATCH') {
    return updateLandingPage(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteLandingPage(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getLandingPage(id: string, res: NextApiResponse) {
  try {
    const page = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM landing_pages WHERE id = ${id}
    `;

    if (page.length === 0) {
      return res.status(404).json({ error: 'Landing page not found' });
    }

    return res.status(200).json(page[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch landing page' });
  }
}

async function updateLandingPage(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      status,
      template,
      formId,
    } = req.body;

    const publishedAt = status === 'published' ? new Date() : null;

    await prisma.$executeRaw`
      UPDATE landing_pages
      SET
        title = COALESCE(${title}, title),
        slug = COALESCE(${slug}, slug),
        content = COALESCE(${content ? JSON.stringify(content) : null}::jsonb, content),
        meta_title = COALESCE(${metaTitle}, meta_title),
        meta_description = ${metaDescription},
        status = COALESCE(${status}, status),
        template = COALESCE(${template}, template),
        form_id = ${formId},
        published_at = COALESCE(${publishedAt ? publishedAt.toISOString() : null}::timestamp, published_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const page = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM landing_pages WHERE id = ${id}
    `;

    return res.status(200).json(page[0]);
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    return res.status(500).json({ error: 'Failed to update landing page' });
  }
}

async function deleteLandingPage(id: string, res: NextApiResponse) {
  try {
    await prisma.$executeRaw`
      DELETE FROM landing_pages WHERE id = ${id}
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete landing page' });
  }
}
