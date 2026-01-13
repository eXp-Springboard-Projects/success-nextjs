import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';

/**
 * Public API endpoint to create support tickets from contact form submissions
 * This endpoint does NOT require authentication since it's called from public contact forms
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();
    const {
      email,
      firstName,
      lastName,
      phone,
      company,
      subject,
      message,
      source = 'contact-form'
    } = req.body;

    // Validate required fields
    if (!email || !message || !subject) {
      return res.status(400).json({ error: 'Email, subject, and message are required' });
    }

    // Step 1: Find or create contact in CRM
    const { data: existingContacts } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);

    let contactId: string;

    if (existingContacts && existingContacts.length > 0) {
      // Update existing contact
      contactId = existingContacts[0].id;
      await supabase
        .from('crm_contacts')
        .update({
          first_name: firstName || existingContacts[0].first_name,
          last_name: lastName || existingContacts[0].last_name,
          phone: phone || existingContacts[0].phone,
          company: company || existingContacts[0].company,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);
    } else {
      // Create new contact
      contactId = nanoid();
      const { error: contactError } = await supabase
        .from('crm_contacts')
        .insert({
          id: contactId,
          email: email.toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || null,
          phone: phone || null,
          company: company || null,
          source,
          status: 'active',
        });

      if (contactError) {
        console.error('Failed to create contact:', contactError);
        return res.status(500).json({ error: 'Failed to create contact' });
      }
    }

    // Step 2: Determine ticket category based on subject
    let category = 'general';
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('subscription') || subjectLower.includes('subscribe')) {
      category = 'subscription';
    } else if (subjectLower.includes('billing') || subjectLower.includes('payment') || subjectLower.includes('refund')) {
      category = 'billing';
    } else if (subjectLower.includes('access') || subjectLower.includes('login') || subjectLower.includes('password')) {
      category = 'access';
    } else if (subjectLower.includes('technical') || subjectLower.includes('bug') || subjectLower.includes('error')) {
      category = 'technical';
    }

    // Step 3: Create support ticket
    const ticketId = nanoid();
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        contact_id: contactId,
        subject,
        description: message,
        priority: 'medium',
        category,
        status: 'open',
        source: source,
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Failed to create ticket:', ticketError);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

    // Step 4: Create initial ticket message
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        id: nanoid(),
        ticket_id: ticketId,
        sender_id: contactId,
        sender_type: 'customer',
        message,
      });

    if (messageError) {
      console.error('Failed to create ticket message:', messageError);
    }

    // Step 5: Create contact activity
    await supabase
      .from('crm_contact_activities')
      .insert({
        id: nanoid(),
        contact_id: contactId,
        type: 'ticket_created',
        description: `Support ticket created from ${source}: ${subject}`,
        metadata: { ticketId, source },
      });

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId: ticket.id,
      contactId,
    });
  } catch (error) {
    console.error('Error creating ticket from contact form:', error);
    return res.status(500).json({ error: 'Failed to create support ticket' });
  }
}
