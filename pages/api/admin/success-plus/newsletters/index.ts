import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      // Fetch all newsletters
      const { data: newsletters, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ newsletters: newsletters || [] });
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      return res.status(500).json({ error: 'Failed to fetch newsletters' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        subject,
        preheader,
        content,
        recipientFilter,
        scheduledFor,
        status,
        sendNow,
      } = req.body;

      if (!subject || !content) {
        return res.status(400).json({ error: 'Subject and content are required' });
      }

      const newsletterId = nanoid();

      // Create newsletter
      const { data: newsletter, error: newsletterError } = await supabase
        .from('newsletters')
        .insert({
          id: newsletterId,
          subject,
          preheader: preheader || null,
          content,
          recipientFilter: recipientFilter || 'all',
          status: status || 'draft',
          scheduledFor: scheduledFor || null,
          createdBy: session.user.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (newsletterError) {
        return res.status(500).json({ error: newsletterError.message });
      }

      // If sending now, process the send
      if (sendNow) {
        // Get recipients based on filter
        let recipientQuery = supabase.from('members').select('id, email, firstName, lastName');

        switch (recipientFilter) {
          case 'active':
            recipientQuery = recipientQuery.eq('membershipStatus', 'Active');
            break;
          case 'trial':
            recipientQuery = recipientQuery.not('trialEndsAt', 'is', null);
            break;
          case 'newsletter_list':
            // Get newsletter subscribers
            const { data: subscribers } = await supabase
              .from('newsletter_subscribers')
              .select('email, memberId, firstName, lastName')
              .eq('status', 'subscribed');

            if (subscribers && subscribers.length > 0) {
              // Send to newsletter subscribers
              await sendNewsletterToRecipients(
                newsletterId,
                subject,
                content,
                subscribers,
                supabase
              );

              // Update newsletter status
              await supabase
                .from('newsletters')
                .update({
                  status: 'sent',
                  sentAt: new Date().toISOString(),
                  recipientCount: subscribers.length,
                  updatedAt: new Date().toISOString(),
                })
                .eq('id', newsletterId);

              return res.status(200).json({
                newsletter,
                message: `Newsletter sent to ${subscribers.length} recipients`,
              });
            }
            break;
        }

        const { data: recipients } = await recipientQuery;

        if (recipients && recipients.length > 0) {
          // Send newsletter to recipients
          await sendNewsletterToRecipients(
            newsletterId,
            subject,
            content,
            recipients,
            supabase
          );

          // Update newsletter status
          await supabase
            .from('newsletters')
            .update({
              status: 'sent',
              sentAt: new Date().toISOString(),
              recipientCount: recipients.length,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', newsletterId);
        }

        return res.status(200).json({
          newsletter,
          message: `Newsletter sent to ${recipients?.length || 0} recipients`,
        });
      }

      return res.status(200).json({ newsletter });
    } catch (error: any) {
      console.error('Error creating newsletter:', error);
      return res.status(500).json({ error: 'Failed to create newsletter' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Helper function to send newsletter to recipients
async function sendNewsletterToRecipients(
  newsletterId: string,
  subject: string,
  content: string,
  recipients: any[],
  supabase: any
) {
  // Log newsletter sends
  const sends = recipients.map((recipient) => ({
    id: nanoid(),
    newsletterId,
    recipientId: recipient.id || recipient.memberId,
    recipientEmail: recipient.email,
    status: 'sent',
    sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));

  await supabase.from('newsletter_sends').insert(sends);

  // In a real implementation, you would integrate with an email service
  // like SendGrid, Mailgun, or AWS SES to send the actual emails
  console.log(`Newsletter ${newsletterId} would be sent to ${recipients.length} recipients`);
  console.log('Subject:', subject);
}
