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
    return getLandingPages(req, res);
  } else if (req.method === 'POST') {
    return createLandingPage(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getLandingPages(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = req.query;
    const status = (query.status as string) || '';
    const page = (query.page as string) || '1';
    const limit = (query.limit as string) || '50';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const pages = await prisma.$queryRawUnsafe<Array<any>>(
      `
      SELECT id, title, slug, status, template, views, conversions,
             published_at, created_by, created_at, updated_at,
             CASE WHEN views > 0 THEN (conversions::float / views * 100) ELSE 0 END as conversion_rate
      FROM landing_pages
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      ...params,
      parseInt(limit),
      offset
    );

    const totalCount = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
      SELECT COUNT(*)::int as count
      FROM landing_pages
      WHERE 1=1 ${whereClause}
    `,
      ...params
    );

    return res.status(200).json({
      pages,
      total: totalCount[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    return res.status(500).json({ error: 'Failed to fetch landing pages' });
  }
}

async function createLandingPage(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      template,
      formId,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const pageId = nanoid();
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    await prisma.$executeRaw`
      INSERT INTO landing_pages (
        id, title, slug, content, meta_title, meta_description,
        template, form_id, created_by
      ) VALUES (
        ${pageId},
        ${title},
        ${finalSlug},
        ${JSON.stringify(content || [])}::jsonb,
        ${metaTitle || title},
        ${metaDescription || null},
        ${template || 'minimal'},
        ${formId || null},
        ${session.user.email}
      )
    `;

    const page = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM landing_pages WHERE id = ${pageId}
    `;

    return res.status(201).json(page[0]);
  } catch (error: any) {
    console.error('Error creating landing page:', error);
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    return res.status(500).json({ error: 'Failed to create landing page' });
  }
}
