import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();
  const { id } = req.query;
  const formData = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Get form
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id as string)
      .single();

    if (formError || !form) {
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
      const { data: existingContacts, error: contactFindError } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', formData.email)
        .limit(1);

      if (contactFindError) throw contactFindError;

      const existingContact = existingContacts?.[0];

      if (!existingContact) {
        const { data: newContact, error: contactCreateError } = await supabase
          .from('contacts')
          .insert({
            id: uuidv4(),
            email: formData.email,
            firstName: formData.firstName || formData.first_name || null,
            lastName: formData.lastName || formData.last_name || null,
            phone: formData.phone || null,
            company: formData.company || null,
            tags: form.tags || [],
            source: `Form: ${form.name}`,
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (contactCreateError) throw contactCreateError;
        contact = newContact;
      } else {
        // Update existing contact with new tags
        const existingTags = existingContact.tags || [];
        const newTags = [...new Set([...existingTags, ...(form.tags || [])])];

        const updateData: any = {
          tags: newTags,
          updatedAt: new Date().toISOString(),
        };

        if (formData.firstName) updateData.firstName = formData.firstName;
        if (formData.first_name) updateData.firstName = formData.first_name;
        if (formData.lastName) updateData.lastName = formData.lastName;
        if (formData.last_name) updateData.lastName = formData.last_name;
        if (formData.phone) updateData.phone = formData.phone;
        if (formData.company) updateData.company = formData.company;

        const { data: updatedContact, error: contactUpdateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', existingContact.id)
          .select()
          .single();

        if (contactUpdateError) throw contactUpdateError;
        contact = updatedContact;
      }

      // Add to list if specified
      if (form.listId && contact) {
        const { data: existingMembers, error: memberFindError } = await supabase
          .from('list_members')
          .select('*')
          .eq('listId', form.listId)
          .eq('contactId', contact.id)
          .limit(1);

        if (memberFindError) throw memberFindError;

        if (!existingMembers || existingMembers.length === 0) {
          const { error: memberCreateError } = await supabase
            .from('list_members')
            .insert({
              id: uuidv4(),
              listId: form.listId,
              contactId: contact.id,
            });

          if (memberCreateError) throw memberCreateError;

          // Update list member count
          const { data: currentList, error: listFetchError } = await supabase
            .from('contact_lists')
            .select('memberCount')
            .eq('id', form.listId)
            .single();

          if (listFetchError) throw listFetchError;

          const { error: listUpdateError } = await supabase
            .from('contact_lists')
            .update({
              memberCount: (currentList?.memberCount || 0) + 1,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', form.listId);

          if (listUpdateError) throw listUpdateError;
        }
      }
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        id: uuidv4(),
        formId: form.id,
        contactId: contact?.id || null,
        data: formData,
        source: req.headers.referer || null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0] || null,
        userAgent: userAgent || null,
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Update form submission count
    const { data: currentForm, error: formFetchError } = await supabase
      .from('forms')
      .select('submissions')
      .eq('id', form.id)
      .single();

    if (formFetchError) throw formFetchError;

    const { error: formUpdateError } = await supabase
      .from('forms')
      .update({
        submissions: (currentForm?.submissions || 0) + 1,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', form.id);

    if (formUpdateError) throw formUpdateError;

    // Send notifications if configured
    if (form.notifyEmails && form.notifyEmails.length > 0) {
      // TODO: Implement email notification
    }

    return res.status(200).json({
      success: true,
      submissionId: submission.id,
      thankYouMessage: form.thankYouMessage,
      redirectUrl: form.redirectUrl,
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({ error: 'Failed to submit form' });
  }
}
