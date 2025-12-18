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
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  try {
    const original = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_templates WHERE id = ${id}
    `;

    if (original.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = original[0];
    const newId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO email_templates (
        id, name, subject, preview_text, html_content, json_content,
        category, variables, is_active, created_by
      ) VALUES (
        ${newId},
        ${template.name + ' (Copy)'},
        ${template.subject},
        ${template.preview_text},
        ${template.html_content},
        ${template.json_content},
        ${template.category},
        ${template.variables},
        false,
        ${session.user.id}
      )
    `;

    const newTemplate = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_templates WHERE id = ${newId}
    `;

    return res.status(201).json(newTemplate[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to duplicate template' });
  }
}
