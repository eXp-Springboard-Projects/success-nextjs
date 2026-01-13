import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { nanoid } from 'nanoid';

/**
 * Contact form submission endpoint
 * Creates a CRM contact and sends notification email
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

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
    const { data: existingContacts, error: contactFindError } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (contactFindError) throw contactFindError;

    const existingContact = existingContacts?.[0];
    let contact;

    if (existingContact) {
      // Update existing contact
      const { data: updatedContact, error: contactUpdateError } = await supabase
        .from('contacts')
        .update({
          firstName,
          lastName,
          phone: phone || existingContact.phone,
          company: company || existingContact.company,
          tags: [...new Set([...existingContact.tags, 'contact-form-lead'])],
          lastContactedAt: new Date().toISOString(),
          notes: existingContact.notes
            ? `${existingContact.notes}\n\n[${new Date().toISOString()}] ${subject}: ${message}`
            : `[${new Date().toISOString()}] ${subject}: ${message}`
        })
        .eq('email', email.toLowerCase())
        .select()
        .single();

      if (contactUpdateError) throw contactUpdateError;
      contact = updatedContact;
    } else {
      // Create new contact
      const { data: newContact, error: contactCreateError } = await supabase
        .from('contacts')
        .insert({
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
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (contactCreateError) throw contactCreateError;
      contact = newContact;
    }

    // Create support ticket from contact form submission
    let ticketId: string | null = null;

    try {
      // Determine ticket category based on subject
      let category = 'general';
      const subjectLower = subject?.toLowerCase() || '';
      if (subjectLower.includes('subscription') || subjectLower.includes('subscribe')) {
        category = 'subscription';
      } else if (subjectLower.includes('billing') || subjectLower.includes('payment') || subjectLower.includes('refund')) {
        category = 'billing';
      } else if (subjectLower.includes('access') || subjectLower.includes('login') || subjectLower.includes('password')) {
        category = 'access';
      } else if (subjectLower.includes('technical') || subjectLower.includes('bug') || subjectLower.includes('error')) {
        category = 'technical';
      }

      ticketId = nanoid();
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          id: ticketId,
          contact_id: contact.id,
          subject: subject || 'Contact Form Inquiry',
          description: message,
          priority: 'medium',
          category,
          status: 'open',
          source: source,
        })
        .select()
        .single();

      if (!ticketError && ticket) {
        // Create initial ticket message
        await supabase
          .from('ticket_messages')
          .insert({
            id: nanoid(),
            ticket_id: ticketId,
            sender_id: contact.id,
            sender_type: 'customer',
            message,
          });

        // Create contact activity for ticket creation
        await supabase
          .from('crm_contact_activities')
          .insert({
            id: nanoid(),
            contact_id: contact.id,
            type: 'ticket_created',
            description: `Support ticket created from ${source}: ${subject || 'Contact Form'}`,
            metadata: { ticketId, source },
          });
      }
    } catch (ticketErr) {
      console.error('Failed to create support ticket:', ticketErr);
      // Continue even if ticket creation fails - don't block the contact form
    }

    // Send notification email to admin
    await sendAdminNotification({
      firstName,
      lastName,
      email,
      phone,
      company,
      subject,
      message,
      ticketId
    });

    // Send confirmation email to user
    await sendUserConfirmation(email, firstName);

    return res.status(200).json({
      message: 'Thanks for reaching out! We\'ll get back to you within 24 hours.',
      success: true,
      contactId: contact.id,
      ticketId
    });
  } catch (error) {
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
  }
}
