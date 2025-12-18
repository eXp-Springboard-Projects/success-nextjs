import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Path parameter required' });
    }

    const redirect = await prisma.url_redirects.findUnique({
      where: { oldUrl: path, isActive: true }
    });

    if (redirect) {
      return res.status(200).json({
        found: true,
        newUrl: redirect.newUrl,
        statusCode: redirect.statusCode
      });
    }

    return res.status(404).json({ found: false });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
