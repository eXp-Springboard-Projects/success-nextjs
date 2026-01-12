import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

async function syncNewsletterSubscribersToLists() {
  console.log('🔄 Syncing newsletter subscribers to contact lists...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all active newsletter subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'ACTIVE');

    if (subscribersError) throw subscribersError;

    console.log(`📧 Found ${subscribers?.length || 0} active newsletter subscribers\n`);

    // Get all contacts with newsletter-subscriber tag
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, email')
      .contains('tags', ['newsletter-subscriber'])
      .eq('status', 'ACTIVE');

    if (contactsError) throw contactsError;

    console.log(`👥 Found ${contacts?.length || 0} contacts with newsletter-subscriber tag\n`);

    // Find or create "S.com newsletter subscribers" list
    let newsletterListId: string;
    const { data: existingList } = await supabase
      .from('contact_lists')
      .select('id')
      .eq('name', 'S.com newsletter subscribers')
      .single();

    if (existingList) {
      newsletterListId = existingList.id;
      console.log(`✅ Found existing list: S.com newsletter subscribers\n`);
    } else {
      // Create the list
      const { data: newList, error: createError } = await supabase
        .from('contact_lists')
        .insert({
          id: randomUUID(),
          name: 'S.com newsletter subscribers',
          description: 'All SUCCESS.com newsletter subscribers',
          type: 'STATIC',
          memberCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
      newsletterListId = newList.id;
      console.log(`✅ Created new list: S.com newsletter subscribers\n`);
    }

    // Add all contacts to the list
    let added = 0;
    let skipped = 0;

    for (const contact of contacts || []) {
      // Check if already in list
      const { data: existingMember } = await supabase
        .from('contact_list_members')
        .select('id')
        .eq('list_id', newsletterListId)
        .eq('contact_id', contact.id)
        .single();

      if (existingMember) {
        skipped++;
        continue;
      }

      // Add to list
      const { error: addError } = await supabase
        .from('contact_list_members')
        .insert({
          id: randomUUID(),
          list_id: newsletterListId,
          contact_id: contact.id,
          added_at: new Date().toISOString(),
        });

      if (addError) {
        console.error(`❌ Error adding ${contact.email}:`, addError.message);
      } else {
        added++;
        if (added % 100 === 0) {
          console.log(`   Added ${added} contacts...`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sync Complete!\n');
    console.log(`   Added to list: ${added}`);
    console.log(`   Already in list: ${skipped}`);
    console.log(`   Total contacts: ${contacts?.length || 0}`);
    console.log('='.repeat(60));

    // Count members in list
    const { count } = await supabase
      .from('contact_list_members')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', newsletterListId);

    console.log(`\n📊 Final count in "S.com newsletter subscribers": ${count || 0}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncNewsletterSubscribersToLists();
