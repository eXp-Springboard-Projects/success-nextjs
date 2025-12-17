import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid landing page ID' });
  }

  try {
    const original = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM landing_pages WHERE id = ${id}
    `;

    if (original.length === 0) {
      return res.status(404).json({ error: 'Landing page not found' });
    }

    const originalPage = original[0];
    const newId = nanoid();
    const newSlug = `${originalPage.slug}-copy-${Date.now()}`;

    await prisma.$executeRaw`
      INSERT INTO landing_pages (
        id, title, slug, content, meta_title, meta_description,
        template, form_id, status, created_by
      ) VALUES (
        ${newId},
        ${`${originalPage.title} (Copy)`},
        ${newSlug},
        ${originalPage.content}::jsonb,
        ${originalPage.meta_title},
        ${originalPage.meta_description},
        ${originalPage.template},
        ${originalPage.form_id},
        ${'draft'},
        ${session.user.email}
      )
    `;

    const newPage = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM landing_pages WHERE id = ${newId}
    `;

    return res.status(201).json(newPage[0]);
  } catch (error) {
    console.error('Error duplicating landing page:', error);
    return res.status(500).json({ error: 'Failed to duplicate landing page' });
  }
}
