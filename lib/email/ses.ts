import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '../supabase';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  contactId?: string;
  campaignId?: string;
}

interface SendTemplateEmailParams {
  to: string | string[];
  templateId: string;
  variables: Record<string, string>;
  from?: string;
  contactId?: string;
  campaignId?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.SES_FROM_EMAIL || 'noreply@success.com',
  contactId,
  campaignId,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const recipients = Array.isArray(to) ? to : [to];

    // Check unsubscribe status for all recipients
    for (const recipient of recipients) {
      const canSend = await checkEmailPermission(recipient);
      if (!canSend) {
return { success: false, error: 'Recipient has unsubscribed or email bounced' };
      }
    }

    // Add unsubscribe link to HTML if contactId provided
    let finalHtml = html;
    if (contactId) {
      const unsubscribeToken = await getUnsubscribeToken(recipients[0]);
      finalHtml = html + `
        <br><br>
        <p style="font-size: 12px; color: #666; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe/${unsubscribeToken}">Unsubscribe</a> |
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe/${unsubscribeToken}">Manage Email Preferences</a>
        </p>
      `;
    }

    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Data: finalHtml,
          },
        },
      },
    });

    const response = await sesClient.send(command);

    // Track send in database
    for (const recipient of recipients) {
      await trackEmailSend({
        recipientEmail: recipient,
        subject,
        contactId,
        campaignId,
        messageId: response.MessageId,
      });
    }

    return { success: true, messageId: response.MessageId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendTemplateEmail({
  to,
  templateId,
  variables,
  from = process.env.SES_FROM_EMAIL || 'noreply@success.com',
  contactId,
  campaignId,
}: SendTemplateEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const recipients = Array.isArray(to) ? to : [to];

    // Check unsubscribe status
    for (const recipient of recipients) {
      const canSend = await checkEmailPermission(recipient);
      if (!canSend) {
return { success: false, error: 'Recipient has unsubscribed or email bounced' };
      }
    }

    // Add unsubscribe token to variables
    if (contactId) {
      const unsubscribeToken = await getUnsubscribeToken(recipients[0]);
      variables.unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe/${unsubscribeToken}`;
    }

    const command = new SendTemplatedEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: recipients,
      },
      Template: templateId,
      TemplateData: JSON.stringify(variables),
    });

    const response = await sesClient.send(command);

    // Track send in database
    for (const recipient of recipients) {
      await trackEmailSend({
        recipientEmail: recipient,
        subject: `Template: ${templateId}`,
        contactId,
        campaignId,
        templateId,
        messageId: response.MessageId,
      });
    }

    return { success: true, messageId: response.MessageId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkEmailPermission(email: string): Promise<boolean> {
  try {
    const supabase = supabaseAdmin();

    const { data: prefs, error } = await supabase
      .from('email_preferences')
      .select('unsubscribed, optInMarketing')
      .eq('email', email)
      .single();

    if (error || !prefs) return true; // No preferences = subscribed by default

    return !prefs.unsubscribed && prefs.optInMarketing;
  } catch (error) {
    return false;
  }
}

async function getUnsubscribeToken(email: string): Promise<string> {
  try {
    const supabase = supabaseAdmin();

    const { data: existing, error } = await supabase
      .from('email_preferences')
      .select('unsubscribeToken')
      .eq('email', email)
      .single();

    if (!error && existing && existing.unsubscribeToken) {
      return existing.unsubscribeToken;
    }

    // Create new token
    const token = nanoid(32);

    // Try to update first
    const { error: updateError } = await supabase
      .from('email_preferences')
      .update({ unsubscribeToken: token })
      .eq('email', email);

    // If no rows were updated, insert
    if (updateError) {
      await supabase
        .from('email_preferences')
        .insert({
          id: nanoid(),
          email,
          unsubscribeToken: token,
        });
    }

    return token;
  } catch (error) {
    return nanoid(32);
  }
}

interface TrackEmailSendParams {
  recipientEmail: string;
  subject: string;
  contactId?: string;
  campaignId?: string;
  templateId?: string;
  messageId?: string;
}

async function trackEmailSend({
  recipientEmail,
  subject,
  contactId,
  campaignId,
  templateId,
  messageId,
}: TrackEmailSendParams): Promise<void> {
  try {
    const supabase = supabaseAdmin();

    const id = nanoid();
    await supabase
      .from('email_sends')
      .insert({
        id,
        contactId: contactId || null,
        recipientEmail,
        subject,
        templateId: templateId || null,
        campaignId: campaignId || null,
        status: 'sent',
        metadata: { messageId },
      });

    // Update contact stats if contactId provided
    if (contactId) {
      // Get current contact to increment
      const { data: contact } = await supabase
        .from('contacts')
        .select('totalEmailsSent')
        .eq('id', contactId)
        .single();

      const totalEmailsSent = (contact?.totalEmailsSent || 0) + 1;

      await supabase
        .from('contacts')
        .update({
          lastEmailSent: new Date().toISOString(),
          totalEmailsSent,
        })
        .eq('id', contactId);

      // Add activity
      await supabase
        .from('crm_contact_activities')
        .insert({
          id: nanoid(),
          contactId,
          type: 'email_sent',
          description: `Email sent: ${subject}`,
          metadata: { campaignId, templateId },
        });
    }
  } catch (error) {
    // Silently fail
  }
}

export async function handleBounce(email: string, bounceType: string): Promise<void> {
  try {
    const supabase = supabaseAdmin();

    // Update contact status
    await supabase
      .from('contacts')
      .update({ emailStatus: 'bounced' })
      .eq('email', email);

    // Update email sends - only those not already bounced
    const { data: emailSends } = await supabase
      .from('email_sends')
      .select('id')
      .eq('recipientEmail', email)
      .is('bouncedAt', null);

    if (emailSends && emailSends.length > 0) {
      await supabase
        .from('email_sends')
        .update({
          status: 'bounced',
          bouncedAt: new Date().toISOString(),
        })
        .in('id', emailSends.map((s: any) => s.id));
    }
  } catch (error) {
    // Silently fail
  }
}

export async function handleComplaint(email: string): Promise<void> {
  try {
    const supabase = supabaseAdmin();

    // Update contact status
    await supabase
      .from('contacts')
      .update({ emailStatus: 'complained' })
      .eq('email', email);

    // Update email preferences - upsert
    const { data: existing } = await supabase
      .from('email_preferences')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      await supabase
        .from('email_preferences')
        .update({
          unsubscribed: true,
          optInMarketing: false,
        })
        .eq('email', email);
    } else {
      await supabase
        .from('email_preferences')
        .insert({
          id: nanoid(),
          email,
          unsubscribed: true,
          optInMarketing: false,
        });
    }

    // Update email sends - only those not already complained
    const { data: emailSends } = await supabase
      .from('email_sends')
      .select('id')
      .eq('recipientEmail', email)
      .is('complainedAt', null);

    if (emailSends && emailSends.length > 0) {
      await supabase
        .from('email_sends')
        .update({
          status: 'complained',
          complainedAt: new Date().toISOString(),
        })
        .in('id', emailSends.map((s: any) => s.id));
    }
  } catch (error) {
    // Silently fail
  }
}

export async function trackEmailOpen(emailSendId: string, contactId?: string): Promise<void> {
  try {
    const supabase = supabaseAdmin();

    // Update email send - only if not already opened
    const { data: emailSend } = await supabase
      .from('email_sends')
      .select('openedAt')
      .eq('id', emailSendId)
      .single();

    if (emailSend && !emailSend.openedAt) {
      await supabase
        .from('email_sends')
        .update({ openedAt: new Date().toISOString() })
        .eq('id', emailSendId);
    }

    if (contactId) {
      // Get current contact to increment
      const { data: contact } = await supabase
        .from('contacts')
        .select('totalOpens')
        .eq('id', contactId)
        .single();

      const totalOpens = (contact?.totalOpens || 0) + 1;

      await supabase
        .from('contacts')
        .update({
          lastEmailOpened: new Date().toISOString(),
          totalOpens,
        })
        .eq('id', contactId);
    }
  } catch (error) {
    // Silently fail
  }
}

export async function trackEmailClick(emailSendId: string, contactId?: string, url?: string): Promise<void> {
  try {
    const supabase = supabaseAdmin();

    // Update email send - only if not already clicked
    const { data: emailSend } = await supabase
      .from('email_sends')
      .select('clickedAt')
      .eq('id', emailSendId)
      .single();

    if (emailSend && !emailSend.clickedAt) {
      await supabase
        .from('email_sends')
        .update({ clickedAt: new Date().toISOString() })
        .eq('id', emailSendId);
    }

    if (contactId) {
      // Get current contact to increment
      const { data: contact } = await supabase
        .from('contacts')
        .select('totalClicks')
        .eq('id', contactId)
        .single();

      const totalClicks = (contact?.totalClicks || 0) + 1;

      await supabase
        .from('contacts')
        .update({ totalClicks })
        .eq('id', contactId);

      // Add activity
      await supabase
        .from('crm_contact_activities')
        .insert({
          id: nanoid(),
          contactId,
          type: 'email_click',
          description: 'Clicked link in email',
          metadata: { url },
        });
    }
  } catch (error) {
    // Silently fail
  }
}
