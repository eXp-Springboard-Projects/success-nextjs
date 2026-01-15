import { supabaseAdmin } from '../lib/supabase';

const updates = [
  {
    id: '2748da68-fc3d-48ed-9ade-dfdd6a18e74f',
    image: '/images/magazines/2748da68-fc3d-48ed-9ade-dfdd6a18e74f.jpg'
  },
  {
    id: 'd3058cee-c22f-401d-852a-0be0af3b5ba1',
    image: '/images/magazines/d3058cee-c22f-401d-852a-0be0af3b5ba1.jpg'
  },
  {
    id: '6a2a5319-b543-4a47-b355-cba1dca0b75a',
    image: '/images/magazines/6a2a5319-b543-4a47-b355-cba1dca0b75a.jpg'
  }
];

async function updateMagazineCovers() {
  const supabase = supabaseAdmin();

  console.log('Updating magazine cover paths in database...\n');

  for (const update of updates) {
    const { error } = await supabase
      .from('store_products')
      .update({ image: update.image })
      .eq('id', update.id);

    if (error) {
      console.error(`✗ Failed to update ${update.id}:`, error);
    } else {
      console.log(`✓ Updated ${update.id} -> ${update.image}`);
    }
  }

  console.log('\nDone!');
}

updateMagazineCovers();
