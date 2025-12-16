import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const originalForm = await prisma.forms.findUnique({
      where: { id: id as string },
    });

    if (!originalForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const duplicatedForm = await prisma.forms.create({
      data: {
        id: uuidv4(),
        name: `${originalForm.name} (Copy)`,
        fields: originalForm.fields,
        settings: originalForm.settings,
        thankYouMessage: originalForm.thankYouMessage,
        redirectUrl: originalForm.redirectUrl,
        listId: originalForm.listId,
        tags: originalForm.tags,
        notifyEmails: originalForm.notifyEmails,
        status: 'draft',
        updatedAt: new Date(),
      },
    });

    return res.status(201).json(duplicatedForm);
  } catch (error) {
    console.error('Error duplicating form:', error);
    return res.status(500).json({ error: 'Failed to duplicate form' });
  }
}
