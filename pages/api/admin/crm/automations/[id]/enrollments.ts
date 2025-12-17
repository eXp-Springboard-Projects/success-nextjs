import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid automation ID' });
  }

  try {
    const { status = '' } = req.query;

    let whereClause = '';
    const params: any[] = [id];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND ae.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const enrollments = await prisma.$queryRawUnsafe(`
      SELECT
        ae.*,
        c.email,
        c.first_name,
        c.last_name,
        c.company
      FROM automation_enrollments ae
      JOIN contacts c ON ae.contact_id = c.id
      WHERE ae.automation_id = $1 ${whereClause}
      ORDER BY ae.enrolled_at DESC
    `, ...params);

    return res.status(200).json({ enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
}
