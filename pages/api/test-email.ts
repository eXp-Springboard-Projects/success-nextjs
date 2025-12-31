import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMail } from '../../lib/resend-email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  try {
    const result = await sendMail(to, subject, html);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Email sent successfully to ${to}`,
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
}
