export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Return mock performance metrics
    // In a real implementation, this would fetch from monitoring service
    const performance = {
      avgResponseTime: Math.floor(Math.random() * 100) + 200, // 200-300ms
      uptime: 99.98,
      requestsPerMinute: Math.floor(Math.random() * 500) + 1000,
      errorRate: (Math.random() * 0.1).toFixed(2)
    };

    res.status(200).json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch performance metrics' });
  }
}
