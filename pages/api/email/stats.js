export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Return mock email stats
    // In a real implementation, this would fetch from email service (Mailchimp, SendGrid, etc.)
    const stats = {
      totalSubscribers: 12547,
      activeSubscribers: 11892,
      totalCampaigns: 45,
      avgOpenRate: 24.5,
      avgClickRate: 3.2
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch email stats' });
  }
}
