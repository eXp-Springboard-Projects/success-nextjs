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
    return getTemplates(req, res);
  } else if (req.method === 'POST') {
    return createTemplate(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category = '', search = '' } = req.query;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR subject ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const templates = await prisma.$queryRawUnsafe(`
      SELECT * FROM email_templates
      WHERE 1=1 ${whereClause}
      ORDER BY updated_at DESC
    `, ...params);

    return res.status(200).json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
}

async function createTemplate(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      name,
      subject,
      previewText,
      htmlContent,
      jsonContent = {},
      category = 'transactional',
      variables = [],
      fromEmail,
      fromName,
    } = req.body;

    if (!name || !subject || !htmlContent) {
      return res.status(400).json({ error: 'Name, subject, and HTML content are required' });
    }

    const templateId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO email_templates (
        id, name, subject, preview_text, html_content, json_content,
        category, variables, is_active, created_by
      ) VALUES (
        ${templateId}, ${name}, ${subject}, ${previewText || null},
        ${htmlContent}, ${JSON.stringify(jsonContent)}::jsonb,
        ${category}, ${JSON.stringify(variables)}::jsonb, true,
        ${session.user.id}
      )
    `;

    const template = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_templates WHERE id = ${templateId}
    `;

    return res.status(201).json(template[0]);
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({ error: 'Failed to create template' });
  }
}
