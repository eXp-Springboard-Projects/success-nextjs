/**
 * Test CRM Campaign - Send to Rachel and Talitha
 */

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function testCRMCampaign() {
  console.log('🧪 Testing CRM Campaign System\n');

  try {
    // Step 1: Create or update contacts
    console.log('📇 Step 1: Creating/updating contacts...');

    const rachelContact = await prisma.contacts.upsert({
      where: { email: 'rachel.nead@exprealty.net' },
      update: {
        firstName: 'Rachel',
        lastName: 'Nead',
        status: 'ACTIVE',
      },
      create: {
        id: nanoid(),
        email: 'rachel.nead@exprealty.net',
        firstName: 'Rachel',
        lastName: 'Nead',
        status: 'ACTIVE',
        source: 'CRM_TEST',
        tags: ['test', 'admin'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const talithaContact = await prisma.contacts.upsert({
      where: { email: 'talitha.prospert@success.com' },
      update: {
        firstName: 'Talitha',
        lastName: 'Prospert',
        status: 'ACTIVE',
      },
      create: {
        id: nanoid(),
        email: 'talitha.prospert@success.com',
        firstName: 'Talitha',
        lastName: 'Prospert',
        status: 'ACTIVE',
        source: 'CRM_TEST',
        tags: ['test', 'admin'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Contacts created:');
    console.log(`   - Rachel: ${rachelContact.email}`);
    console.log(`   - Talitha: ${talithaContact.email}\n`);

    // Step 2: Create a contact list
    console.log('📋 Step 2: Creating contact list...');

    const list = await prisma.contact_lists.create({
      data: {
        id: nanoid(),
        name: 'Test Campaign Recipients',
        description: 'Test list for Rachel and Talitha',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ List created: "${list.name}" (ID: ${list.id})\n`);

    // Step 3: Add contacts to list
    console.log('➕ Step 3: Adding contacts to list...');

    await prisma.list_members.createMany({
      data: [
        {
          id: nanoid(),
          listId: list.id,
          contactId: rachelContact.id,
          addedAt: new Date(),
        },
        {
          id: nanoid(),
          listId: list.id,
          contactId: talithaContact.id,
          addedAt: new Date(),
        },
      ],
    });

    console.log('✅ Contacts added to list\n');

    // Step 4: Create campaign
    console.log('📧 Step 4: Creating campaign...');

    const campaign = await prisma.campaigns.create({
      data: {
        id: nanoid(),
        name: 'SUCCESS Magazine - Test Campaign',
        subject: '🎉 Welcome to SUCCESS Magazine CRM!',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Campaign created: "${campaign.name}"\n`);

    // Step 5: Send campaign
    console.log('🚀 Step 5: Sending campaign...');

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d32f2f; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #d32f2f; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 SUCCESS Magazine CRM</h1>
            </div>
            <div class="content">
              <h2>Hi {{firstName}}!</h2>
              <p>This is a <strong>test campaign</strong> from the SUCCESS Magazine CRM system.</p>

              <h3>✅ What's Working:</h3>
              <ul>
                <li>Email sending infrastructure ✓</li>
                <li>Contact management ✓</li>
                <li>Campaign creation ✓</li>
                <li>Batch email processing ✓</li>
                <li>Template variable replacement ✓</li>
              </ul>

              <p>Your email address is: <strong>{{email}}</strong></p>

              <p style="margin-top: 30px;">
                <strong>Status:</strong> All systems operational! 🚀
              </p>

              <a href="http://localhost:3000/admin/crm" class="button">View CRM Dashboard</a>
            </div>
            <div class="footer">
              <p>&copy; 2025 SUCCESS Magazine. All rights reserved.</p>
              <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Import sendCampaignEmail function
    const { sendCampaignEmail } = await import('../lib/email');

    let sentCount = 0;
    let failedCount = 0;

    // Send to Rachel
    console.log('   📤 Sending to Rachel...');
    const rachelResult = await sendCampaignEmail(
      {
        email: rachelContact.email,
        firstName: rachelContact.firstName,
        lastName: rachelContact.lastName,
        company: null,
      },
      campaign.subject,
      emailHTML
    );

    if (rachelResult.success) {
      sentCount++;
      await prisma.email_events.create({
        data: {
          id: nanoid(),
          campaignId: campaign.id,
          contactId: rachelContact.id,
          emailAddress: rachelContact.email,
          event: 'sent',
          eventData: {
            from: 'SUCCESS Magazine <onboarding@resend.dev>',
            subject: campaign.subject,
          },
          createdAt: new Date(),
        },
      });
      console.log('   ✅ Sent to Rachel');
    } else {
      failedCount++;
      console.log(`   ❌ Failed to send to Rachel: ${rachelResult.error}`);
    }

    // Delay between sends
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send to Talitha
    console.log('   📤 Sending to Talitha...');
    const talithaResult = await sendCampaignEmail(
      {
        email: talithaContact.email,
        firstName: talithaContact.firstName,
        lastName: talithaContact.lastName,
        company: null,
      },
      campaign.subject,
      emailHTML
    );

    if (talithaResult.success) {
      sentCount++;
      await prisma.email_events.create({
        data: {
          id: nanoid(),
          campaignId: campaign.id,
          contactId: talithaContact.id,
          emailAddress: talithaContact.email,
          event: 'sent',
          eventData: {
            from: 'SUCCESS Magazine <onboarding@resend.dev>',
            subject: campaign.subject,
          },
          createdAt: new Date(),
        },
      });
      console.log('   ✅ Sent to Talitha');
    } else {
      failedCount++;
      console.log(`   ❌ Failed to send to Talitha: ${talithaResult.error}`);
    }

    // Update campaign status
    await prisma.campaigns.update({
      where: { id: campaign.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount,
        failedCount,
        updatedAt: new Date(),
      },
    });

    console.log('\n📊 Campaign Results:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Campaign: ${campaign.name}`);
    console.log(`   Subject: ${campaign.subject}`);
    console.log(`   Sent: ${sentCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Status: ${sentCount > 0 ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ CRM Campaign Test Complete!\n');
    console.log('📧 Check inboxes:');
    console.log('   - rachel.nead@exprealty.net');
    console.log('   - talitha.prospert@success.com\n');

  } catch (error) {
    console.error('❌ Error testing CRM campaign:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testCRMCampaign();
