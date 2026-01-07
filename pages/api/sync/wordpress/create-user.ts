// WordPress User Creation API
// Replaces: Alexis | Sync | Create User (77K enrollments)
// Triggers: Manual enrollment, SUCCESS+ purchase, job queue

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

interface WordPressUserCreateResponse {
  id: number;
  username: string;
  email: string;
  link: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !['STAFF', 'ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Unauthorized - staff access required' });
  }

  const { contactId, contactEmail } = req.body;

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

    // Check if WordPress user already exists
    const wpApiUrl = process.env.WORDPRESS_API_URL?.replace('/wp-json/wp/v2', '');
    const wpUser = process.env.WORDPRESS_API_USER;
    const wpPassword = process.env.WORDPRESS_API_PASSWORD;

    if (!wpApiUrl || !wpUser || !wpPassword) {
      return res.status(500).json({ message: 'WordPress credentials not configured' });
    }

    // Check existing user
    const checkResponse = await fetch(
      `${wpApiUrl}/wp-json/wp/v2/users?search=${encodeURIComponent(contact.email)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${wpUser}:${wpPassword}`).toString('base64')}`,
        },
      }
    );

    const existingUsers = await checkResponse.json();

    if (existingUsers && existingUsers.length > 0) {
      // User exists, update instead
      return res.status(200).json({
        success: true,
        message: 'User already exists',
        userId: existingUsers[0].id,
        action: 'existing',
      });
    }

    // Generate username from email
    const username = contact.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // Generate random password
    const password = generateRandomPassword();

    // Create WordPress user
    const createResponse = await fetch(`${wpApiUrl}/wp-json/wp/v2/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${wpUser}:${wpPassword}`).toString('base64')}`,
      },
      body: JSON.stringify({
        username,
        email: contact.email,
        password,
        first_name: contact.firstName || '',
        last_name: contact.lastName || '',
        roles: ['subscriber'], // Default role
        meta: {
          phone: contact.phone || '',
          success_plus_member: contact.successPlusMemberPortalStatus === 'active' ? '1' : '0',
          member_status: contact.successPlusMemberPortalStatus || '',
          lifecycle_stage: contact.lifecycleStage || 'subscriber',
        },
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`WordPress user creation failed: ${error.message || createResponse.statusText}`);
    }

    const wpUserData: WordPressUserCreateResponse = await createResponse.json();

    // Update contact with WordPress user ID
    await supabase
      .from('contacts')
      .update({
        wordpressUserId: wpUserData.id.toString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', contact.id);

    // Log workflow execution
    await supabase.from('workflow_executions').insert({
      workflowName: 'Alexis | Sync | Create User',
      workflowType: 'wordpress_sync',
      contactId: contact.id,
      status: 'completed',
      triggerSource: 'manual',
      triggeredBy: session.user.id,
      completedAt: new Date().toISOString(),
    });

    // Send welcome email with login credentials
    await supabase.from('scheduled_actions').insert({
      contactId: contact.id,
      actionType: 'send_email',
      actionData: {
        template: 'wordpress-account-created',
        to: contact.email,
        data: {
          username,
          password,
          loginUrl: `${wpApiUrl}/wp-login.php`,
        },
      },
      scheduledFor: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    });

    return res.status(201).json({
      success: true,
      message: 'WordPress user created successfully',
      userId: wpUserData.id,
      username: wpUserData.username,
      action: 'created',
    });
  } catch (error: any) {
    console.error('WordPress user creation error:', error);
    return res.status(500).json({
      message: error.message || 'Failed to create WordPress user',
    });
  }
}

function generateRandomPassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
