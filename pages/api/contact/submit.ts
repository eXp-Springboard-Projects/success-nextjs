import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Contact form submission endpoint
 * Creates a CRM contact and sends notification email
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      subject,
      message,
      source = 'contact-form'
    } = req.body;

    if (!email || !message || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create or update contact in CRM
    const existingContact = await prisma.contacts.findUnique({
      where: { email: email.toLowerCase() }
    });

    let contact;

    if (existingContact) {
      // Update existing contact
      contact = await prisma.contacts.update({
        where: { email: email.toLowerCase() },
        data: {
          firstName,
          lastName,
          phone: phone || existingContact.phone,
          company: company || existingContact.company,
          tags: [...new Set([...existingContact.tags, 'contact-form-lead'])],
          lastContactedAt: new Date(),
          notes: existingContact.notes
            ? `${existingContact.notes}\n\n[${new Date().toISOString()}] ${subject}: ${message}`
            : `[${new Date().toISOString()}] ${subject}: ${message}`
        }
      });
    } else {
      // Create new contact
      contact = await prisma.contacts.create({
        data: {
          id: randomUUID(),
          email: email.toLowerCase(),
          firstName,
          lastName,
          phone: phone || null,
          company: company || null,
          source,
          tags: ['contact-form-lead'],
          status: 'ACTIVE',
          notes: `[${new Date().toISOString()}] ${subject}: ${message}`,
          updatedAt: new Date(),
        }
      });
    }

    // Send notification email to admin
    await sendAdminNotification({
      firstName,
      lastName,
      email,
      phone,
      company,
      subject,
      message
    });

    // Send confirmation email to user
    await sendUserConfirmation(email, firstName);

    return res.status(200).json({
      message: 'Thanks for reaching out! We\'ll get back to you within 24 hours.',
      success: true,
      contactId: contact.id
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to submit form. Please try again.' });
  }
}

/**
 * Send notification email to admin team
 */
async function sendAdminNotification(data: any) {
  try {
    // For now, just log. You can integrate with your email service
// Example SendGrid integration:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: process.env.ADMIN_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `New Contact Form: ${data.subject}`,
      text: `Name: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\n...`,
      html: `<h3>New Contact Form Submission</h3><p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>...`
    };

    await sgMail.send(msg);
    */
  } catch (error) {
    console.error('Admin notification error:', error);
  }
}

/**
 * Send confirmation email to user
 */
async function sendUserConfirmation(email: string, firstName: string) {
  try {
// Example SendGrid integration:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'We received your message',
      text: `Hi ${firstName}, thanks for contacting SUCCESS Magazine...`,
      html: `<h3>Hi ${firstName}!</h3><p>Thanks for contacting SUCCESS Magazine...</p>`
    };

    await sgMail.send(msg);
    */
  } catch (error) {
    console.error('User confirmation error:', error);
  }
}
