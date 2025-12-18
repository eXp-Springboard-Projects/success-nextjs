import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      let config = await prisma.paywall_config.findFirst();

      // Create default config if none exists
      if (!config) {
        config = await prisma.paywall_config.create({
          data: {
            id: randomUUID(),
            freeArticleLimit: 3,
            resetPeriodDays: 30,
            enablePaywall: true,
            bypassedCategories: [],
            bypassedArticles: [],
            popupTitle: "You've reached your free article limit",
            popupMessage: "Subscribe to SUCCESS+ to get unlimited access to our premium content, exclusive interviews, and member-only benefits.",
            ctaButtonText: "Subscribe Now",
            updatedAt: new Date(),
          }
        });
      }

      return res.status(200).json(config);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update config (admin only - add auth check)
  if (req.method === 'PUT') {
    try {
      const {
        freeArticleLimit,
        resetPeriodDays,
        enablePaywall,
        bypassedCategories,
        bypassedArticles,
        popupTitle,
        popupMessage,
        ctaButtonText
      } = req.body;

      const config = await prisma.paywall_config.findFirst();

      if (config) {
        const updated = await prisma.paywall_config.update({
          where: { id: config.id },
          data: {
            freeArticleLimit,
            resetPeriodDays,
            enablePaywall,
            bypassedCategories,
            bypassedArticles,
            popupTitle,
            popupMessage,
            ctaButtonText
          }
        });

        return res.status(200).json(updated);
      } else {
        const created = await prisma.paywall_config.create({
          data: {
            id: randomUUID(),
            freeArticleLimit,
            resetPeriodDays,
            enablePaywall,
            bypassedCategories,
            bypassedArticles,
            popupTitle,
            popupMessage,
            ctaButtonText,
            updatedAt: new Date(),
          }
        });

        return res.status(201).json(created);
      }
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
