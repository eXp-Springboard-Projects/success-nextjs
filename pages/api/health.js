import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
