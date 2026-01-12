import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupUnsubscribeList() {
  console.log('🚀 Setting up automatic unsubscribe list...\n');
  console.log('⚠️  NOTE: Run add-system-lists-column.sql first if isSystem column does not exist\n');

  try {
    // Check if unsubscribe list already exists
    const { data: existingList } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('name', '🚫 Unsubscribed Contacts')
      .single();

    if (existingList) {
      console.log('✓ Unsubscribe list already exists');
      console.log('  ID:', existingList.id);
      console.log('  Member Count:', existingList.memberCount);
      return;
    }

    // Create the automatic unsubscribe list
    const unsubscribeListId = uuidv4();
    const { data: newList, error: createError } = await supabase
      .from('contact_lists')
      .insert({
        id: unsubscribeListId,
        name: '🚫 Unsubscribed Contacts',
        description: 'Automatically tracks all contacts who have unsubscribed from emails. Contacts are auto-added when they unsubscribe and auto-removed when they resubscribe.',
        type: 'DYNAMIC',
        isSystem: true,
        filters: {
          logic: 'AND',
          conditions: [
            {
              field: 'status',
              operator: 'equals',
              value: 'UNSUBSCRIBED'
            }
          ]
        },
        memberCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    console.log('✓ Created automatic unsubscribe list');
    console.log('  ID:', newList.id);
    console.log('  Name:', newList.name);
    console.log('  Type:', newList.type);

    // Count current unsubscribed contacts
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'UNSUBSCRIBED');

    console.log(`\n✓ Current unsubscribed contacts: ${count || 0}`);
    console.log('\nℹ️  This list will automatically:');
    console.log('   • Add contacts when their status becomes UNSUBSCRIBED');
    console.log('   • Remove contacts when their status becomes ACTIVE');
    console.log('   • Prevent unsubscribed contacts from being included in email campaigns');

  } catch (error) {
    console.error('❌ Error setting up unsubscribe list:', error);
    throw error;
  }
}

setupUnsubscribeList()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
