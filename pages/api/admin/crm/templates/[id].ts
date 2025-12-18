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
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  if (req.method === 'GET') {
    return getTemplate(id, res);
  } else if (req.method === 'PATCH') {
    return updateTemplate(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteTemplate(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTemplate(id: string, res: NextApiResponse) {
  try {
    const template = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_templates WHERE id = ${id}
    `;

    if (template.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.status(200).json(template[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch template' });
  }
}

async function updateTemplate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      name,
      subject,
      previewText,
      htmlContent,
      jsonContent,
      category,
      variables,
      isActive,
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

    if (htmlContent !== undefined) {
      updates.push(`html_content = $${paramIndex}`);
      params.push(htmlContent);
      paramIndex++;
    }

    if (jsonContent !== undefined) {
      updates.push(`json_content = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(jsonContent));
      paramIndex++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (variables !== undefined) {
      updates.push(`variables = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(variables));
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      await prisma.$queryRawUnsafe(
        `UPDATE email_templates SET ${updates.join(', ')} WHERE id = $1`,
        ...params
      );
    }

    const template = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_templates WHERE id = ${id}
    `;

    return res.status(200).json(template[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update template' });
  }
}

async function deleteTemplate(id: string, res: NextApiResponse) {
  try {
    await prisma.$executeRaw`
      DELETE FROM email_templates WHERE id = ${id}
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete template' });
  }
}
