import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aczlassjkbtwenzsohwm.supabase.co',
  'sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQK'
);

async function sendTestEmail() {
  console.log('Fetching staff users...');

  // Get all staff/admin users
  const { data: staff, error } = await supabase
    .from('users')
    .select('email, name, role');

  if (error) {
    console.error('Error fetching staff:', error);
    return;
  }

  console.log(`Found ${staff?.length || 0} users`);

  if (staff && staff.length > 0) {
    console.log('\nStaff list:');
    staff.forEach(s => console.log(`  - ${s.email} (${s.name}) - ${s.role}`));

    // Get emails for the test
    const staffEmails = staff.map(s => s.email).filter(e => e);

    console.log(`\nSending test email to ${staffEmails.length} recipients...`);
    console.log('Recipients:', staffEmails.join(', '));

    // Create the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        id: 'test-' + Date.now(),
        name: 'Staff Test Email',
        subject: 'Test email from success.com',
        content: '<p>Testing our new email system from success.com</p><p>-Rachel</p>',
        from_name: 'SUCCESS Magazine',
        from_email: 'hello@success.com',
        status: 'DRAFT',
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        failed_count: 0,
        delivered_count: 0,
        metadata: {
          recipientMode: 'emails',
          directEmails: staffEmails,
          fromName: 'SUCCESS Magazine',
          fromEmail: 'hello@success.com',
        }
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Error creating campaign:', campaignError);
      return;
    }

    console.log('✅ Campaign created:', campaign.id);
    console.log('\nTo send this campaign, use the admin dashboard at:');
    console.log(`/admin/crm/campaigns/${campaign.id}`);
    console.log('\nOr you can trigger it via API by calling:');
    console.log(`POST /api/admin/crm/campaigns/${campaign.id}/send`);
  } else {
    console.log('No staff users found');
  }
}

sendTestEmail();
