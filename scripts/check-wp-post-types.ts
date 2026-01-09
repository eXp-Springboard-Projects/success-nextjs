async function checkWordPressPostTypes() {
  console.log('🔍 Checking WordPress post types and statuses...\n');

  // Check all available post statuses
  console.log('1️⃣ Trying different post statuses for the specific slug...');
  const statuses = ['publish', 'draft', 'pending', 'private', 'future', 'any'];

  for (const status of statuses) {
    const response = await fetch(
      `https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?slug=25-minute-fitness-iron-bodyfit&status=${status}&_embed`,
      { headers: { 'User-Agent': 'SUCCESS-Check-Script' } }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        console.log(`   ✅ FOUND with status="${status}"`);
        console.log(`      ID: ${data[0].id}`);
        console.log(`      Title: ${data[0].title.rendered}`);
        console.log(`      Actual Status: ${data[0].status}`);
        console.log(`      Type: ${data[0].type}`);
      }
    }
  }

  // Check for custom post types
  console.log('\n2️⃣ Checking available post types...');
  const typesResponse = await fetch(
    'https://successcom.wpenginepowered.com/wp-json/wp/v2/types',
    { headers: { 'User-Agent': 'SUCCESS-Check-Script' } }
  );

  if (typesResponse.ok) {
    const types = await typesResponse.json();
    console.log('   Available post types:');
    for (const [key, value] of Object.entries(types)) {
      const typeData = value as any;
      console.log(`   - ${key}: ${typeData.name} (REST base: ${typeData.rest_base || 'N/A'})`);
    }
  }

  // Try searching by exact title
  console.log('\n3️⃣ Searching by title...');
  const searchResponse = await fetch(
    'https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?search=25-Minute+Fitness+Iron+Bodyfit&per_page=5&_embed',
    { headers: { 'User-Agent': 'SUCCESS-Check-Script' } }
  );

  if (searchResponse.ok) {
    const results = await searchResponse.json();
    console.log(`   Found ${results.length} results`);
    results.forEach((post: any) => {
      console.log(`   - ${post.title.rendered} (ID: ${post.id}, Status: ${post.status}, Slug: ${post.slug})`);
    });
  }

  // Check recent posts
  console.log('\n4️⃣ Checking most recent posts (last 10)...');
  const recentResponse = await fetch(
    'https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?per_page=10&orderby=modified&order=desc&_embed',
    { headers: { 'User-Agent': 'SUCCESS-Check-Script' } }
  );

  if (recentResponse.ok) {
    const recent = await recentResponse.json();
    console.log('   Most recently modified posts:');
    recent.forEach((post: any, i: number) => {
      console.log(`   ${i + 1}. ${post.title.rendered.substring(0, 60)}...`);
      console.log(`      Slug: ${post.slug}`);
      console.log(`      Modified: ${post.modified}`);
    });
  }
}

checkWordPressPostTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
