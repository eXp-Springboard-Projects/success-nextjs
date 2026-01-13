import { supabaseAdmin } from '../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      message: 'Missing required fields',
      errors: {
        name: !name ? 'Name is required' : null,
        email: !email ? 'Email is required' : null,
        subject: !subject ? 'Subject is required' : null,
        message: !message ? 'Message is required' : null,
      }
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format',
      errors: { email: 'Please enter a valid email address' }
    });
  }

  // Validate message length
  if (message.length < 10) {
    return res.status(400).json({
      message: 'Message too short',
      errors: { message: 'Message must be at least 10 characters' }
    });
  }

  try {
    const supabase = supabaseAdmin();

    // Step 1: Create or update contact in CRM
    const { data: existingContacts } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);

    let contactId;

    if (existingContacts && existingContacts.length > 0) {
      // Update existing contact
      contactId = existingContacts[0].id;
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      await supabase
        .from('crm_contacts')
        .update({
          first_name: firstName || existingContacts[0].first_name,
          last_name: lastName || existingContacts[0].last_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);
    } else {
      // Create new contact
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      contactId = nanoid();
      await supabase
        .from('crm_contacts')
        .insert({
          id: contactId,
          email: email.toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || name,
          source: 'contact-page',
          status: 'active',
        });
    }

    // Step 2: Determine ticket category based on subject
    let category = 'general';
    const subjectLower = subject.toLowerCase();

    if (subjectLower === 'subscription') category = 'subscription';
    else if (subjectLower === 'advertising') category = 'billing';
    else if (subjectLower === 'press') category = 'general';
    else if (subjectLower === 'partnership') category = 'general';
    else if (subjectLower === 'feedback') category = 'general';

    // Step 3: Create support ticket
    const ticketId = nanoid();
    await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        contact_id: contactId,
        subject: subject === 'general' ? 'General Inquiry' : subject.charAt(0).toUpperCase() + subject.slice(1),
        description: message,
        priority: 'medium',
        category,
        status: 'open',
        source: 'contact-page',
      });

    // Step 4: Create initial ticket message
    await supabase
      .from('ticket_messages')
      .insert({
        id: nanoid(),
        ticket_id: ticketId,
        sender_id: contactId,
        sender_type: 'customer',
        message,
      });

    // Step 5: Create contact activity
    await supabase
      .from('crm_contact_activities')
      .insert({
        id: nanoid(),
        contact_id: contactId,
        type: 'ticket_created',
        description: `Support ticket created from contact page: ${subject}`,
        metadata: { ticketId, source: 'contact-page' },
      });

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      ticketId,
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      message: 'Failed to submit contact form. Please try again later.',
      error: error.message,
    });
  }
}
