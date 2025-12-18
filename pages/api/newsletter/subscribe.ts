import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Newsletter subscription endpoint
 * Creates both a newsletter subscriber and a CRM contact
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, firstName, source = 'website' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    // Check if already subscribed
    const existing = await prisma.newsletter_subscribers.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return res.status(200).json({
          message: "You're already subscribed to our newsletter!",
          alreadySubscribed: true
        });
      } else {
        // Reactivate subscription
        await prisma.newsletter_subscribers.update({
          where: { email: email.toLowerCase() },
          data: {
            status: 'ACTIVE',
            subscribedAt: new Date(),
            unsubscribedAt: null
          }
        });

        return res.status(200).json({
          message: 'Welcome back! Your subscription has been reactivated.',
          reactivated: true
        });
      }
    }

    // Create newsletter subscriber
    await prisma.newsletter_subscribers.create({
      data: {
        id: randomUUID(),
        email: email.toLowerCase(),
        status: 'ACTIVE',
        subscribedAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Also create/update CRM contact
    const existingContact = await prisma.contacts.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingContact) {
      // Update existing contact
      await prisma.contacts.update({
        where: { email: email.toLowerCase() },
        data: {
          firstName: firstName || existingContact.firstName,
          tags: [...new Set([...existingContact.tags, 'newsletter-subscriber'])],
          lastContactedAt: new Date()
        }
      });
    } else {
      // Create new contact
      await prisma.contacts.create({
        data: {
          id: randomUUID(),
          email: email.toLowerCase(),
          firstName: firstName || null,
          source,
          tags: ['newsletter-subscriber'],
          status: 'ACTIVE',
          updatedAt: new Date(),
        }
      });
    }

    // Optional: Send welcome email
    await sendWelcomeEmail(email, firstName);

    return res.status(201).json({
      message: 'Thanks for subscribing! Check your email for confirmation.',
      success: true
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
  }
}

/**
 * Add to ConvertKit (if configured)
 */
async function addToConvertKit(email: string, firstName?: string): Promise<boolean> {
  const apiKey = process.env.CONVERTKIT_API_KEY;
  const formId = process.env.CONVERTKIT_FORM_ID;

  if (!apiKey || !formId) {
    return false; // Not configured
  }

  try {
    const response = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        email,
        first_name: firstName || '',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('ConvertKit error:', error);
    return false;
  }
}

/**
 * Add to Mailchimp (if configured)
 */
async function addToMailchimp(email: string, firstName?: string): Promise<boolean> {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX; // e.g., 'us1'

  if (!apiKey || !audienceId || !serverPrefix) {
    return false; // Not configured
  }

  try {
    const response = await fetch(
      `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: firstName || '',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      // Ignore if already subscribed
      if (error.title === 'Member Exists') {
        return true;
      }
      console.error('Mailchimp error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Mailchimp error:', error);
    return false;
  }
}

/**
 * Send welcome email to new subscriber
 */
async function sendWelcomeEmail(email: string, firstName?: string) {
  try {
    // Add to email service providers
    await Promise.all([
      addToConvertKit(email, firstName),
      addToMailchimp(email, firstName),
    ]);

} catch (error) {
    console.error('Welcome email error:', error);
    // Don't fail the subscription if email fails
  }
}
