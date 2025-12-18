import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { sendCampaignEmail, sendEmailBatch } from '../../../lib/email';

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

    // Get contacts from list using proper Prisma schema
    const listMembers = await prisma.list_members.findMany({
      where: { listId },
      include: { contacts: true },
    });

    if (listMembers.length === 0) {
      return res.status(400).json({ error: 'Selected list has no contacts' });
    }

    const contacts = listMembers.map(lm => lm.contacts);
    const recipientCount = contacts.length;

    // Create campaign using proper campaigns table
    const campaignId = nanoid();
    const scheduledDate = sendNow ? null : (scheduledAt ? new Date(scheduledAt) : null);

    const campaign = await prisma.campaigns.create({
      data: {
        id: campaignId,
        name: `Quick Email: ${subject.substring(0, 50)}`,
        subject,
        status: sendNow ? 'SENDING' : 'SCHEDULED',
        scheduledAt: scheduledDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // If sending now, send emails immediately
    if (sendNow) {
      // Create email sending tasks
      const emailTasks = contacts.map((contact) => {
        return async () => {
          const result = await sendCampaignEmail(contact, subject, content);

          // Log the email event
          if (result.success) {
            await prisma.email_events.create({
              data: {
                id: nanoid(),
                campaignId: campaign.id,
                contactId: contact.id,
                emailAddress: contact.email,
                event: 'sent',
                eventData: {
                  fromName,
                  fromEmail,
                },
              },
            });
          } else {
            await prisma.email_events.create({
              data: {
                id: nanoid(),
                campaignId: campaign.id,
                contactId: contact.id,
                emailAddress: contact.email,
                event: 'failed',
                eventData: {
                  error: result.error || 'Unknown error',
                },
              },
            });
          }

          return result;
        };
      });

      // Send in batches
      const { sentCount, failedCount, errors } = await sendEmailBatch(emailTasks, 50, 500);

      // Update campaign with results
      await prisma.campaigns.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          sentCount,
          failedCount,
          sendErrors: errors.length > 0 ? errors : null,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        message: `Email sent to ${sentCount} recipients${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        campaignId,
        sentCount,
        failedCount,
        recipientCount,
      });
    } else {
      // Schedule for later - cron job will process it
      return res.status(200).json({
        message: 'Email scheduled successfully',
        campaignId,
        recipientCount,
        scheduledAt: scheduledDate?.toISOString(),
      });
    }
  } catch (error: any) {
    console.error('Email send error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send email',
    });
  } finally {
    await prisma.$disconnect();
  }
}
