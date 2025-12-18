import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

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
    console.error('Error sending email:', error);
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
    console.error('Error sending template email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkEmailPermission(email: string): Promise<boolean> {
  try {
    const prefs = await prisma.$queryRaw<Array<{ unsubscribed: boolean; opt_in_marketing: boolean }>>`
      SELECT unsubscribed, opt_in_marketing
      FROM email_preferences
      WHERE email = ${email}
    `;

    if (prefs.length === 0) return true; // No preferences = subscribed by default

    const pref = prefs[0];
    return !pref.unsubscribed && pref.opt_in_marketing;
  } catch (error) {
    console.error('Error checking email permission:', error);
    return false;
  }
}

async function getUnsubscribeToken(email: string): Promise<string> {
  try {
    const existing = await prisma.$queryRaw<Array<{ unsubscribe_token: string }>>`
      SELECT unsubscribe_token
      FROM email_preferences
      WHERE email = ${email}
    `;

    if (existing.length > 0 && existing[0].unsubscribe_token) {
      return existing[0].unsubscribe_token;
    }

    // Create new token
    const token = nanoid(32);
    await prisma.$executeRaw`
      INSERT INTO email_preferences (id, email, unsubscribe_token)
      VALUES (${nanoid()}, ${email}, ${token})
      ON CONFLICT (email)
      DO UPDATE SET unsubscribe_token = ${token}
    `;

    return token;
  } catch (error) {
    console.error('Error getting unsubscribe token:', error);
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
    const id = nanoid();
    await prisma.$executeRaw`
      INSERT INTO email_sends (
        id, contact_id, recipient_email, subject, template_id, campaign_id, status, metadata
      ) VALUES (
        ${id}, ${contactId || null}, ${recipientEmail}, ${subject},
        ${templateId || null}, ${campaignId || null}, 'sent',
        ${JSON.stringify({ messageId })}::jsonb
      )
    `;

    // Update contact stats if contactId provided
    if (contactId) {
      await prisma.$executeRaw`
        UPDATE crm_contacts
        SET
          last_email_sent = CURRENT_TIMESTAMP,
          total_emails_sent = total_emails_sent + 1
        WHERE id = ${contactId}
      `;

      // Add activity
      await prisma.$executeRaw`
        INSERT INTO crm_contact_activities (id, contact_id, type, description, metadata)
        VALUES (
          ${nanoid()}, ${contactId}, 'email_sent',
          'Email sent: ${subject}',
          ${JSON.stringify({ campaignId, templateId })}::jsonb
        )
      `;
    }
  } catch (error) {
    console.error('Error tracking email send:', error);
  }
}

export async function handleBounce(email: string, bounceType: string): Promise<void> {
  try {
    // Update contact status
    await prisma.$executeRaw`
      UPDATE crm_contacts
      SET email_status = 'bounced'
      WHERE email = ${email}
    `;

    // Update email sends
    await prisma.$executeRaw`
      UPDATE email_sends
      SET
        status = 'bounced',
        bounced_at = CURRENT_TIMESTAMP
      WHERE recipient_email = ${email} AND bounced_at IS NULL
    `;
  } catch (error) {
    console.error('Error handling bounce:', error);
  }
}

export async function handleComplaint(email: string): Promise<void> {
  try {
    // Update contact status
    await prisma.$executeRaw`
      UPDATE crm_contacts
      SET email_status = 'complained'
      WHERE email = ${email}
    `;

    // Update email preferences
    await prisma.$executeRaw`
      INSERT INTO email_preferences (id, email, unsubscribed, opt_in_marketing)
      VALUES (${nanoid()}, ${email}, true, false)
      ON CONFLICT (email)
      DO UPDATE SET unsubscribed = true, opt_in_marketing = false
    `;

    // Update email sends
    await prisma.$executeRaw`
      UPDATE email_sends
      SET
        status = 'complained',
        complained_at = CURRENT_TIMESTAMP
      WHERE recipient_email = ${email} AND complained_at IS NULL
    `;
  } catch (error) {
    console.error('Error handling complaint:', error);
  }
}

export async function trackEmailOpen(emailSendId: string, contactId?: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE email_sends
      SET opened_at = CURRENT_TIMESTAMP
      WHERE id = ${emailSendId} AND opened_at IS NULL
    `;

    if (contactId) {
      await prisma.$executeRaw`
        UPDATE crm_contacts
        SET
          last_email_opened = CURRENT_TIMESTAMP,
          total_opens = total_opens + 1
        WHERE id = ${contactId}
      `;
    }
  } catch (error) {
    console.error('Error tracking email open:', error);
  }
}

export async function trackEmailClick(emailSendId: string, contactId?: string, url?: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE email_sends
      SET clicked_at = CURRENT_TIMESTAMP
      WHERE id = ${emailSendId} AND clicked_at IS NULL
    `;

    if (contactId) {
      await prisma.$executeRaw`
        UPDATE crm_contacts
        SET total_clicks = total_clicks + 1
        WHERE id = ${contactId}
      `;

      // Add activity
      await prisma.$executeRaw`
        INSERT INTO crm_contact_activities (id, contact_id, type, description, metadata)
        VALUES (
          ${nanoid()}, ${contactId}, 'email_click',
          'Clicked link in email',
          ${JSON.stringify({ url })}::jsonb
        )
      `;
    }
  } catch (error) {
    console.error('Error tracking email click:', error);
  }
}
