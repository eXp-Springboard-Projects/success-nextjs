import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQK';

const pagesToCreate = [
  {
    title: 'Magazine',
    slug: 'magazine',
    content: '<h1>SUCCESS Magazine</h1><p>Explore digital and print editions of SUCCESS Magazine.</p>',
    status: 'PUBLISHED',
    template: 'magazine',
    order: 1,
  },
  {
    title: 'Coaching',
    slug: 'coaching',
    content: '<h1>SUCCESS Coaching</h1><p>Transform your life with expert coaching programs.</p>',
    status: 'PUBLISHED',
    template: 'coaching',
    order: 2,
  },
  {
    title: 'Labs',
    slug: 'labs',
    content: '<h1>SUCCESS Labs</h1><p>Interactive tools and resources for personal growth.</p>',
    status: 'PUBLISHED',
    template: 'labs',
    order: 3,
  },
  {
    title: 'SUCCESS+',
    slug: 'success-plus',
    content: '<h1>SUCCESS+</h1><p>Premium content and exclusive member benefits.</p>',
    status: 'PUBLISHED',
    template: 'success-plus',
    order: 4,
  },
  {
    title: 'Professional Growth',
    slug: 'professional-growth',
    content: '<h1>Professional Growth</h1><p>Advance your career with expert insights and strategies.</p>',
    status: 'PUBLISHED',
    template: 'category',
    order: 5,
  },
  {
    title: 'AI & Technology',
    slug: 'ai-technology',
    content: '<h1>AI & Technology</h1><p>Stay ahead with the latest in AI and technology trends.</p>',
    status: 'PUBLISHED',
    template: 'category',
    order: 6,
  },
  {
    title: 'Business & Branding',
    slug: 'business-branding',
    content: '<h1>Business & Branding</h1><p>Build and grow your business with proven strategies.</p>',
    status: 'PUBLISHED',
    template: 'category',
    order: 7,
  },
  {
    title: 'Store',
    slug: 'store',
    content: '<h1>SUCCESS Store</h1><p>Shop books, courses, and SUCCESS Magazine merchandise.</p>',
    status: 'PUBLISHED',
    template: 'store',
    order: 8,
  },
  {
    title: 'Press',
    slug: 'press',
    content: '<h1>Press & Media</h1><p>Press releases, media kit, and SUCCESS Magazine news.</p>',
    status: 'PUBLISHED',
    template: 'press',
    order: 9,
  },
];

async function seedPages() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n📄 Seeding Pages\n');
  console.log('='.repeat(80));

  for (const pageData of pagesToCreate) {
    console.log(`\n📝 Creating: ${pageData.title}`);

    // Check if page already exists
    const { data: existing } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', pageData.slug)
      .single();

    if (existing) {
      console.log(`   ⚠️  Already exists, skipping...`);
      continue;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('pages')
      .insert({
        id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...pageData,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
        seoTitle: pageData.title,
        seoDescription: pageData.content.replace(/<[^>]*>/g, '').substring(0, 160),
      })
      .select()
      .single();

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Created: /${data.slug}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Page seeding complete!\n');
}

seedPages().catch(console.error);
