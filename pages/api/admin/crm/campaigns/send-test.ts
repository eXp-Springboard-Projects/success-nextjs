import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, content, fromName, fromEmail } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In a real implementation, this would use an email service like SendGrid, Mailgun, etc.
    // For now, we'll just log it and return success
    console.log('Sending test email:', {
      to,
      from: `${fromName} <${fromEmail}>`,
      subject,
      contentLength: content.length,
    });

    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return res.status(200).json({
      success: true,
      message: `Test email sent to ${to}`,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ error: 'Failed to send test email' });
  }
}
