async function checkEmails() {
  const response = await fetch('https://api.resend.com/emails', {
    headers: {
      'Authorization': 'Bearer re_QaFFqr2e_FXZYdyaEXu5VsJjw3bPA2yqH'
    }
  });

  const data = await response.json();

  console.log('\n📧 Recent Emails from Resend API\n');
  console.log('='.repeat(80));

  const recentEmails = data.data.slice(0, 15);

  recentEmails.forEach((email: any, index: number) => {
    console.log(`\n${index + 1}. To: ${email.to[0]}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   From: ${email.from}`);
    console.log(`   Status: ${email.last_event}`);
    console.log(`   Sent: ${email.created_at}`);
    console.log(`   ID: ${email.id}`);
  });

  console.log('\n' + '='.repeat(80));

  const toSuccessCom = recentEmails.filter((e: any) => e.to[0].includes('@success.com'));
  const toExpRealty = recentEmails.filter((e: any) => e.to[0].includes('@exprealty.net'));

  console.log(`\n📊 Summary:`);
  console.log(`   Emails to @success.com: ${toSuccessCom.length}`);
  console.log(`   Emails to @exprealty.net: ${toExpRealty.length}`);
  console.log(`   Total recent emails: ${recentEmails.length}`);
  console.log('');
}

checkEmails().catch(console.error);
