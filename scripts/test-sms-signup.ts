/**
 * Test SMS signup flow end-to-end
 */

async function testSignup() {
  console.log('🧪 Testing SMS signup flow...\n');

  const testData = {
    firstName: 'Test',
    lastName: 'User',
    phone: '+1 (555) 123-4567',
    email: `test.${Date.now()}@example.com`, // Unique email each time
  };

  console.log('📝 Submitting test signup:');
  console.log(`   Name: ${testData.firstName} ${testData.lastName}`);
  console.log(`   Phone: ${testData.phone}`);
  console.log(`   Email: ${testData.email}\n`);

  try {
    const response = await fetch('http://localhost:3000/api/daily-sms/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! Signup completed successfully!\n');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('\n📊 Check Supabase to verify the record was created:');
      console.log('   https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor?schema=public&table=sms_subscribers');
    } else {
      console.log('❌ FAILED! Server returned an error:\n');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error('❌ FAILED! Network or server error:\n');
    console.error(error.message);
    console.log('\n⚠️  Make sure the dev server is running:');
    console.log('   npm run dev');
  }
}

testSignup()
  .then(() => {
    console.log('\n✨ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
