// WordPress User Update API
// Replaces: Alexis | Sync | Update User & Metadata (192K enrollments)
// Triggers: Manual enrollment, contact updates, SUCCESS+ changes

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !['STAFF', 'ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Unauthorized - staff access required' });
  }

  const { contactId, contactEmail, updateFields } = req.body;

  if (!contactId && !contactEmail) {
    return res.status(400).json({ message: 'contactId or contactEmail required' });
  }

  try {
    const supabase = supabaseAdmin();

    // Get contact details
    const query = supabase
      .from('contacts')
      .select('*')
      .single();

    if (contactId) {
      query.eq('id', contactId);
    } else {
      query.eq('email', contactEmail);
    }

    const { data: contact, error: contactError } = await query;

    if (contactError || !contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Check if contact has WordPress user ID
    if (!contact.wordpressUserId) {
      return res.status(400).json({
        message: 'Contact does not have a WordPress user ID. Create user first.',
      });
    }

    const wpApiUrl = process.env.WORDPRESS_API_URL?.replace('/wp-json/wp/v2', '');
    const wpUser = process.env.WORDPRESS_API_USER;
    const wpPassword = process.env.WORDPRESS_API_PASSWORD;

    if (!wpApiUrl || !wpUser || !wpPassword) {
      return res.status(500).json({ message: 'WordPress credentials not configured' });
    }

    // Prepare update data
    const updateData: any = {
      first_name: contact.firstName || '',
      last_name: contact.lastName || '',
      meta: {
        phone: contact.phone || '',
        success_plus_member: contact.successPlusMemberPortalStatus === 'active' ? '1' : '0',
        member_status: contact.successPlusMemberPortalStatus || '',
        membership_start_date: contact.successPlusMembershipStartDate || '',
        lifecycle_stage: contact.lifecycleStage || 'subscriber',
        hubspot_score: contact.hubspotScore || 0,
        contact_priority: contact.contactPriority || '',
        // Add any additional custom fields
        ...updateFields,
      },
    };

    // Determine role based on SUCCESS+ status
    if (contact.successPlusMemberPortalStatus === 'active') {
      updateData.roles = ['success_plus_member'];
    }

    // Update WordPress user
    const updateResponse = await fetch(
      `${wpApiUrl}/wp-json/wp/v2/users/${contact.wordpressUserId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${wpUser}:${wpPassword}`).toString('base64')}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(`WordPress user update failed: ${error.message || updateResponse.statusText}`);
    }

    const wpUserData = await updateResponse.json();

    // Log workflow execution
    await supabase.from('workflow_executions').insert({
      workflowName: 'Alexis | Sync | Update User & Metadata',
      workflowType: 'wordpress_sync',
      contactId: contact.id,
      status: 'completed',
      triggerSource: 'manual',
      triggeredBy: session.user.id,
      completedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'WordPress user updated successfully',
      userId: wpUserData.id,
      username: wpUserData.username,
    });
  } catch (error: any) {
    console.error('WordPress user update error:', error);
    return res.status(500).json({
      message: error.message || 'Failed to update WordPress user',
    });
  }
}
