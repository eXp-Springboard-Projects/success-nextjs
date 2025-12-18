import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { sendEmail } from '../../../../../lib/email';

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

    // Actually send the email using configured email service (Resend or SendGrid)
    const success = await sendEmail({
      to,
      subject,
      html: content,
    });

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Email service not configured or failed to send. Check RESEND_API_KEY or SENDGRID_API_KEY in environment variables.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Test email sent to ${to}`,
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email',
    });
  }
}
