import { supabaseAdmin } from '../lib/supabase';

const supabase = supabaseAdmin();

async function addMagazines() {
  console.log('Checking magazines table...');

  // First check if table exists and get sample
  const { data: existing, error: checkError } = await supabase
    .from('magazines')
    .select('*')
    .limit(1);

  if (checkError) {
    console.error('Error checking table:', checkError.message);
    return;
  }

  console.log('Sample magazine structure:', existing);

  const magazines = [
    {
      id: 'mag_dec_2025',
      title: 'SUCCESS Magazine - December 2025',
      slug: 'december-2025',
      publishedText: '2025-12-01T00:00:00.000Z',
      description: 'The December 2025 issue of SUCCESS Magazine featuring inspiring stories, expert advice, and actionable strategies for personal and professional growth.',
      coverImageUrl: 'https://read.mysuccessplus.com/success/20251202/cover.jpg',
      flipbookUrl: 'https://read.mysuccessplus.com/success/20251202/index.html',
      fileSize: 0,
      totalPages: 100,
      status: 'PUBLISHED'
    },
    {
      id: 'mag_nov_2025',
      title: 'SUCCESS Magazine - November 2025',
      slug: 'november-2025',
      publishedText: '2025-11-01T00:00:00.000Z',
      description: 'The November 2025 issue of SUCCESS Magazine with exclusive interviews, business insights, and strategies for achieving your goals.',
      coverImageUrl: 'https://read.mysuccessplus.com/success/20251104/cover.jpg',
      flipbookUrl: 'https://read.mysuccessplus.com/success/20251104/index.html',
      fileSize: 0,
      totalPages: 100,
      status: 'PUBLISHED'
    },
    {
      id: 'mag_oct_2025',
      title: 'SUCCESS Magazine - October 2025',
      slug: 'october-2025',
      publishedText: '2025-10-01T00:00:00.000Z',
      description: 'The October 2025 issue of SUCCESS Magazine featuring cutting-edge content on leadership, entrepreneurship, and personal development.',
      coverImageUrl: 'https://read.mysuccessplus.com/success/20251007/cover.jpg',
      flipbookUrl: 'https://read.mysuccessplus.com/success/20251007/index.html',
      fileSize: 0,
      totalPages: 100,
      status: 'PUBLISHED'
    }
  ];

  for (const mag of magazines) {
    console.log(`\nInserting: ${mag.title}`);
    const { data, error } = await supabase
      .from('magazines')
      .upsert(mag, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✓ Success');
    }
  }

  console.log('\n\nFetching all published magazines...');
  const { data: allMags, error: fetchError } = await supabase
    .from('magazines')
    .select('id, title, status, flipbookUrl')
    .eq('status', 'PUBLISHED')
    .order('publishedText', { ascending: false });

  if (fetchError) {
    console.error('Fetch error:', fetchError);
  } else {
    console.log('\nPublished magazines:');
    console.table(allMags);
  }
}

addMagazines().catch(console.error);
