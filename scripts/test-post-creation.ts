import { supabaseAdmin } from '../lib/supabase';

const supabase = supabaseAdmin();

async function testPostCreation() {
  console.log('Testing post creation...\n');

  // First, check the schema
  const { data: schemaData, error: schemaError } = await supabase
    .from('posts')
    .select('*')
    .limit(1);

  if (schemaError) {
    console.error('Error querying posts table:', schemaError);
    return;
  }

  console.log('Posts table is accessible\n');

  // Try to create a test post
  const testPost = {
    id: `post_test_${Date.now()}`,
    title: 'Test Post',
    slug: 'test-post-' + Date.now(),
    content: '<p>Test content</p>',
    excerpt: 'Test excerpt',
    status: 'DRAFT',
    featuredImage: null,
    featuredImageAlt: null,
    seoTitle: null,
    seoDescription: null,
    authorId: 'b89df95d-6092-43ac-bf9a-133467206cb3', // Your user ID
    publishedAt: null,
    contentPillar: 'AI_TECHNOLOGY',
    customAuthorId: null,
    featureOnHomepage: false,
    featureInPillarSection: false,
    showInTrending: false,
    mainFeaturedArticle: false,
  };

  console.log('Attempting to insert test post:', testPost);

  const { data, error } = await supabase
    .from('posts')
    .insert(testPost)
    .select()
    .single();

  if (error) {
    console.error('\n❌ POST CREATION FAILED:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
  } else {
    console.log('\n✅ POST CREATED SUCCESSFULLY:');
    console.log(data);

    // Clean up test post
    await supabase.from('posts').delete().eq('id', testPost.id);
    console.log('\nTest post deleted');
  }
}

testPostCreation();
