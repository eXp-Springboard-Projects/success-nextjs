import { NextApiRequest, NextApiResponse } from 'next';
import { sendMail } from '@/lib/resend-email';

/**
 * Email Sending API
 *
 * Generic email endpoint using Resend.
 * For specialized emails (password reset, welcome, etc.), use the dedicated functions in lib/resend-email.ts
 */

interface EmailPayload {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, text, html }: EmailPayload = req.body;

    // Validation
    if (!to || !subject) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject'
      });
    }

    if (!text && !html) {
      return res.status(400).json({
        error: 'Email must have text or html content'
      });
    }

    // Convert text to html if needed
    const emailHtml = html || `<p>${text?.replace(/\n/g, '<br>')}</p>`;

    // Handle multiple recipients
    const recipients = Array.isArray(to) ? to : [to];
    const results = [];

    for (const recipient of recipients) {
      const result = await sendMail(recipient, subject, emailHtml);
      results.push({ to: recipient, ...result });
    }

    // Check if all emails succeeded
    const allSucceeded = results.every(r => r.success);

    if (allSucceeded) {
      return res.status(200).json({
        success: true,
        message: `Email sent successfully to ${recipients.length} recipient(s)`,
        results,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Some emails failed to send',
        results,
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
