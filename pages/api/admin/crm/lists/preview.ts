import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function buildFilterWhere(filters: any) {
  if (!filters || !filters.conditions || filters.conditions.length === 0) {
    return {};
  }

  const conditions = filters.conditions.map((condition: any) => {
    const { field, operator, value } = condition;

    switch (field) {
      case 'status':
        if (operator === 'equals') {
          return { status: value };
        } else if (operator === 'not_equals') {
          return { status: { not: value } };
        }
        break;

      case 'tags':
        if (operator === 'contains') {
          return { tags: { has: value } };
        } else if (operator === 'not_contains') {
          return { NOT: { tags: { has: value } } };
        } else if (operator === 'is_empty') {
          return { tags: { equals: [] } };
        } else if (operator === 'is_not_empty') {
          return { NOT: { tags: { equals: [] } } };
        }
        break;

      case 'source':
        if (operator === 'equals') {
          return { source: value };
        } else if (operator === 'not_equals') {
          return { source: { not: value } };
        } else if (operator === 'contains') {
          return { source: { contains: value, mode: 'insensitive' } };
        } else if (operator === 'is_empty') {
          return { source: null };
        } else if (operator === 'is_not_empty') {
          return { source: { not: null } };
        }
        break;

      case 'emailEngagementScore':
        const score = parseInt(value, 10);
        if (operator === 'greater_than') {
          return { emailEngagementScore: { gt: score } };
        } else if (operator === 'less_than') {
          return { emailEngagementScore: { lt: score } };
        } else if (operator === 'equals') {
          return { emailEngagementScore: score };
        }
        break;

      case 'lastContactedAt':
        if (operator === 'in_last_days') {
          const days = parseInt(value, 10);
          const date = new Date();
          date.setDate(date.getDate() - days);
          return { lastContactedAt: { gte: date } };
        } else if (operator === 'not_in_last_days') {
          const days = parseInt(value, 10);
          const date = new Date();
          date.setDate(date.getDate() - days);
          return { lastContactedAt: { lt: date } };
        } else if (operator === 'is_empty') {
          return { lastContactedAt: null };
        } else if (operator === 'is_not_empty') {
          return { lastContactedAt: { not: null } };
        }
        break;

      case 'createdAt':
        if (operator === 'in_last_days') {
          const days = parseInt(value, 10);
          const date = new Date();
          date.setDate(date.getDate() - days);
          return { createdAt: { gte: date } };
        } else if (operator === 'not_in_last_days') {
          const days = parseInt(value, 10);
          const date = new Date();
          date.setDate(date.getDate() - days);
          return { createdAt: { lt: date } };
        } else if (operator === 'before_date') {
          return { createdAt: { lt: new Date(value) } };
        } else if (operator === 'after_date') {
          return { createdAt: { gt: new Date(value) } };
        }
        break;
    }

    return {};
  });

  if (filters.logic === 'OR') {
    return { OR: conditions };
  } else {
    return { AND: conditions };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { filters } = req.body;

      const where = buildFilterWhere(filters);
      const count = await prisma.contacts.count({ where });

      return res.status(200).json({ count });
    } catch (error) {
      console.error('Error previewing filters:', error);
      return res.status(500).json({ error: 'Failed to preview filters' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
