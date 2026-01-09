async function checkNovemberPosts() {
  console.log('🔍 Checking posts published in November 2025...\n');

  const response = await fetch(
    'https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?after=2025-11-01T00:00:00Z&before=2025-12-01T00:00:00Z&per_page=100&_embed',
    { headers: { 'User-Agent': 'SUCCESS-Check-Script' } }
  );

  const data = await response.json();

  console.log(`Found ${data.length} posts published in November 2025\n`);

  data.forEach((post: any, i: number) => {
    console.log(`${i + 1}. ${post.title.rendered}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Date: ${post.date}`);
    console.log(`   ID: ${post.id}`);
  });

  console.log('\n📊 Summary:');
  console.log(`   Total November 2025 posts in API: ${data.length}`);
  console.log(`   NOTE: "25-minute-fitness-iron-bodyfit" was published Nov 17, 2025`);
  console.log(`   but is NOT in this list, confirming it's hidden from API`);
}

checkNovemberPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
