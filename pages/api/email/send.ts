import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Email Sending API
 *
 * This API endpoint handles sending emails via SendGrid, Resend, or other email providers.
 * For now, it's a placeholder that logs to console for development.
 *
 * To integrate with a real email service:
 * 1. Install the email provider SDK:
 *    - SendGrid: npm install @sendgrid/mail
 *    - Resend: npm install resend
 * 2. Add API keys to .env.local:
 *    - SENDGRID_API_KEY or RESEND_API_KEY
 * 3. Implement the actual sending logic below
 */

interface EmailPayload {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, any>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, from, subject, text, html, template, templateData }: EmailPayload = req.body;

    // Validation
    if (!to || !subject) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject'
      });
    }

    if (!text && !html && !template) {
      return res.status(400).json({
        error: 'Email must have text, html, or template content'
      });
    }

    // For development: Log email to console instead of sending
    console.log('📧 EMAIL SEND REQUEST:', {
      to,
      from: from || 'noreply@success.com',
      subject,
      text: text?.substring(0, 100) + '...',
      html: html ? 'HTML content provided' : 'No HTML',
      template,
      templateData,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement actual email sending when ready
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to,
      from: from || 'noreply@success.com',
      subject,
      text,
      html,
    });
    */

    // Example with Resend:
    /*
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: from || 'SUCCESS <noreply@success.com>',
      to,
      subject,
      html: html || text,
    });
    */

    return res.status(200).json({
      success: true,
      message: 'Email queued for delivery (development mode - logged to console)',
      development: true,
    });

  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
