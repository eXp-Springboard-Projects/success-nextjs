import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const formData = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Get form
    const form = await prisma.forms.findUnique({
      where: { id: id as string },
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.status !== 'active') {
      return res.status(400).json({ error: 'Form is not active' });
    }

    // Validate required fields
    const fields = form.fields as any[];
    for (const field of fields) {
      if (field.required && !formData[field.name]) {
        return res.status(400).json({ error: `Field ${field.label} is required` });
      }
    }

    // Find or create contact
    let contact = null;
    if (formData.email) {
      contact = await prisma.contacts.findUnique({
        where: { email: formData.email },
      });

      if (!contact) {
        contact = await prisma.contacts.create({
          data: {
            id: uuidv4(),
            email: formData.email,
            firstName: formData.firstName || formData.first_name || null,
            lastName: formData.lastName || formData.last_name || null,
            phone: formData.phone || null,
            company: formData.company || null,
            tags: form.tags,
            source: `Form: ${form.name}`,
            updatedAt: new Date(),
          },
        });
      } else {
        // Update existing contact with new tags
        const existingTags = contact.tags || [];
        const newTags = [...new Set([...existingTags, ...form.tags])];

        await prisma.contacts.update({
          where: { id: contact.id },
          data: {
            tags: newTags,
            ...(formData.firstName && { firstName: formData.firstName }),
            ...(formData.first_name && { firstName: formData.first_name }),
            ...(formData.lastName && { lastName: formData.lastName }),
            ...(formData.last_name && { lastName: formData.last_name }),
            ...(formData.phone && { phone: formData.phone }),
            ...(formData.company && { company: formData.company }),
            updatedAt: new Date(),
          },
        });
      }

      // Add to list if specified
      if (form.listId && contact) {
        const existingMember = await prisma.list_members.findFirst({
          where: {
            listId: form.listId,
            contactId: contact.id,
          },
        });

        if (!existingMember) {
          await prisma.list_members.create({
            data: {
              id: uuidv4(),
              listId: form.listId,
              contactId: contact.id,
            },
          });

          // Update list member count
          await prisma.contact_lists.update({
            where: { id: form.listId },
            data: {
              memberCount: {
                increment: 1,
              },
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    // Create submission
    const submission = await prisma.form_submissions.create({
      data: {
        id: uuidv4(),
        formId: form.id,
        contactId: contact?.id || null,
        data: formData,
        source: req.headers.referer || null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0] || null,
        userAgent: userAgent || null,
      },
    });

    // Update form submission count
    await prisma.forms.update({
      where: { id: form.id },
      data: {
        submissions: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    // Send notifications if configured
    if (form.notifyEmails && form.notifyEmails.length > 0) {
      // TODO: Implement email notification
      // For now, just log
      console.log(`Form submission notification needed for: ${form.notifyEmails.join(', ')}`);
    }

    return res.status(200).json({
      success: true,
      submissionId: submission.id,
      thankYouMessage: form.thankYouMessage,
      redirectUrl: form.redirectUrl,
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    return res.status(500).json({ error: 'Failed to submit form' });
  }
}
