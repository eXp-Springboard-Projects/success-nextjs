import { supabaseAdmin } from '../lib/supabase';

async function findAndUpdateArticles() {
  const supabase = supabaseAdmin();

  const articles = [
    { slug: '4-benefits-of-having-a-pet-that-promotes-success', newAuthor: 'Jaclyn Greenberg' },
    { slug: 'mental-health-day-signs', newAuthor: 'Jaclyn Greenberg' }
  ];

  console.log('Searching for articles...\n');

  for (const article of articles) {
    // Search by slug
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, authorName, wordpressId')
      .eq('slug', article.slug)
      .single();

    if (error) {
      console.log(`Error finding ${article.slug}:`, error.message);
      console.log('');
      continue;
    }

    if (!data) {
      console.log(`Not found: ${article.slug}`);
      console.log('');
      continue;
    }

    console.log(`Found: ${data.title}`);
    console.log(`  ID: ${data.id}`);
    console.log(`  Current Author: ${data.authorName}`);
    console.log(`  WordPress ID: ${data.wordpressId}`);

    // Update the author
    const { error: updateError } = await supabase
      .from('posts')
      .update({ authorName: article.newAuthor })
      .eq('id', data.id);

    if (updateError) {
      console.log(`  Error updating: ${updateError.message}`);
    } else {
      console.log(`  Updated author to: ${article.newAuthor}`);
    }

    console.log('');
  }
}

findAndUpdateArticles();
