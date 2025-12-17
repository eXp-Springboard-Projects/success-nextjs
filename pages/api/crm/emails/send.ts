import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      subject,
      content,
      listId,
      fromName,
      fromEmail,
      sendNow,
      scheduledAt,
    } = req.body;

    if (!subject || !content || !listId) {
      return res.status(400).json({ error: 'Subject, content, and list ID are required' });
    }

    // Get contact count from list
    const listContacts = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM contact_list_memberships
      WHERE list_id = ${listId}
    `;

    const recipientCount = Number(listContacts[0]?.count || 0);

    if (recipientCount === 0) {
      return res.status(400).json({ error: 'Selected list has no contacts' });
    }

    // Create a campaign for this email
    const campaignId = nanoid();
    const scheduledDate = sendNow ? null : new Date(scheduledAt);

    await prisma.$executeRaw`
      INSERT INTO crm_campaigns (
        id,
        name,
        subject,
        from_name,
        from_email,
        status,
        scheduled_at,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${campaignId},
        ${'Quick Email: ' + subject.substring(0, 50)},
        ${subject},
        ${fromName},
        ${fromEmail},
        ${sendNow ? 'SENDING' : 'SCHEDULED'},
        ${scheduledDate},
        ${session.user.id},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;

    // Create campaign email content
    const emailId = nanoid();
    await prisma.$executeRaw`
      INSERT INTO crm_campaign_emails (
        id,
        campaign_id,
        subject,
        content,
        send_delay_days,
        created_at,
        updated_at
      ) VALUES (
        ${emailId},
        ${campaignId},
        ${subject},
        ${content},
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;

    // Link campaign to list
    await prisma.$executeRaw`
      INSERT INTO crm_campaign_lists (
        campaign_id,
        list_id,
        created_at
      ) VALUES (
        ${campaignId},
        ${listId},
        CURRENT_TIMESTAMP
      )
    `;

    // If sending now, queue emails for all contacts in the list
    if (sendNow) {
      await prisma.$executeRaw`
        INSERT INTO crm_emails (
          id,
          campaign_id,
          contact_id,
          subject,
          content,
          from_name,
          from_email,
          status,
          created_at,
          updated_at
        )
        SELECT
          gen_random_uuid(),
          ${campaignId},
          clm.contact_id,
          ${subject},
          ${content},
          ${fromName},
          ${fromEmail},
          'PENDING',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        FROM contact_list_memberships clm
        WHERE clm.list_id = ${listId}
      `;
    }

    // Log activity
    await prisma.$executeRaw`
      INSERT INTO crm_activities (
        id,
        contact_id,
        type,
        source,
        description,
        metadata,
        created_by,
        created_at
      )
      SELECT
        gen_random_uuid(),
        clm.contact_id,
        'EMAIL_QUEUED',
        'CRM',
        ${'Email queued: ' + subject},
        jsonb_build_object(
          'campaign_id', ${campaignId},
          'subject', ${subject},
          'scheduled', ${!sendNow}
        ),
        ${session.user.id},
        CURRENT_TIMESTAMP
      FROM contact_list_memberships clm
      WHERE clm.list_id = ${listId}
      LIMIT 100
    `;

    return res.status(200).json({
      message: sendNow ? 'Email queued for sending' : 'Email scheduled successfully',
      campaignId,
      recipientCount,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
