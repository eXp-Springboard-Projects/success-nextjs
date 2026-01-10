import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';
import { sendEmail } from '../../../../lib/email';
import { nanoid } from 'nanoid';

/**
 * Send a one-off email to a single recipient
 * No campaign or list required - direct send
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const {
      to,
      subject,
      content,
      contactId,
      fromName,
      fromEmail,
    } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'To, subject, and content are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check if recipient is unsubscribed
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('email', to)
      .single();

    if (prefs?.unsubscribed) {
      return res.status(400).json({
        error: 'Cannot send to unsubscribed contact',
        message: `${to} has unsubscribed from emails`
      });
    }

    // Send email
    const success = await sendEmail({
      to,
      subject,
      html: content,
    });

    if (!success) {
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Log the email event
    const eventId = nanoid();
    await supabase
      .from('email_events')
      .insert({
        id: eventId,
        contactId: contactId || null,
        emailAddress: to,
        event: 'sent',
        eventData: {
          subject,
          fromName: fromName || session.user.name,
          fromEmail: fromEmail || 'hello@success.com',
          sentBy: session.user.id,
          type: 'one-off',
        },
        createdAt: new Date().toISOString(),
      });

    // If contactId provided, add note to contact
    if (contactId) {
      try {
        await supabase
          .from('contact_notes')
          .insert({
            id: nanoid(),
            contactId,
            note: `Email sent: "${subject}"`,
            createdBy: session.user.id,
            createdAt: new Date().toISOString(),
          });
      } catch (noteError) {
        // Non-fatal - continue even if note fails
        console.error('Failed to add contact note:', noteError);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Email sent to ${to}`,
      eventId,
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send email',
    });
  }
}
