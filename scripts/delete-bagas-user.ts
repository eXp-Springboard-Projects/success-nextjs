/**
 * IMMEDIATE USER DELETION SCRIPT
 * Deletes bagasramadhan88888@success.com from the database
 *
 * Run with: npx tsx scripts/delete-bagas-user.ts
 */

async function deleteUser() {
  const email = 'bagasramadhan88888@success.com';

  try {
    // Call the production API endpoint
    const response = await fetch('https://www.success.com/api/admin/staff/delete-by-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS:', data.message);
      console.log('Deleted user:', data.deletedUser);
    } else {
      console.error('❌ ERROR:', data.error);
      if (response.status === 401) {
        console.log('\n⚠️  You need to delete this user manually:');
        console.log('1. Go to https://www.success.com/admin/staff');
        console.log('2. Find bagasramadhan88888@success.com');
        console.log('3. Click Delete');
        console.log('\nOR use Supabase Dashboard:');
        console.log('1. Go to https://app.supabase.com/project/aczlassjkbtwenzsohwm');
        console.log('2. Table Editor → users');
        console.log('3. Find and delete the row with email bagasramadhan88888@success.com');
      }
    }
  } catch (error) {
    console.error('❌ FAILED:', error);
    console.log('\n⚠️  Manual deletion required:');
    console.log('Option 1 - Admin Panel:');
    console.log('  Go to https://www.success.com/admin/staff and delete the user\n');
    console.log('Option 2 - Supabase Dashboard:');
    console.log('  1. Go to https://app.supabase.com/project/aczlassjkbtwenzsohwm');
    console.log('  2. Navigate to Table Editor → users table');
    console.log('  3. Find row with email: bagasramadhan88888@success.com');
    console.log('  4. Delete the row');
  }
}

deleteUser();
