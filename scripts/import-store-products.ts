import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

// Products from store page
const storeProducts = [
  {
    name: 'Jim Rohn Book Bundle',
    price: 181.69,
    salePrice: 97.00,
    image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/e/848/jr_book-bundle__68973.jpg',
    category: 'Bundles',
    externalUrl: 'https://mysuccessplus.com/shop',
    featured: true,
    description: 'Complete collection of Jim Rohn\'s most influential books',
  },
  {
    name: 'The Five Major Pieces to the Life Puzzle',
    price: 24.99,
    image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/i/808/jr010-002__12948.jpg',
    category: 'Books',
    subcategory: 'Jim Rohn',
    externalUrl: 'https://mysuccessplus.com/shop',
  },
  {
    name: 'Leading an Inspired Life',
    price: 29.99,
    image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/w/124/jr010-004__26100.jpg',
    category: 'Books',
    subcategory: 'Jim Rohn',
    externalUrl: 'https://mysuccessplus.com/product/leading-an-inspired-life',
    featured: true,
  },
  {
    name: "Jim Rohn's Foundations for Success",
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop',
    category: 'Courses',
    subcategory: 'Personal Development',
    externalUrl: 'https://mysuccessplus.com/product/jim-rohns-foundations-for-success',
    featured: true,
    description: '10 modules of training with hours of video and audio content',
  },
  {
    name: 'The SUCCESS Starts Here Journal',
    price: 14.99,
    salePrice: 9.71,
    image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/S23_Journal_SUCCESS-STARTS-HERE__48992-1.png',
    category: 'Merchandise',
    subcategory: 'Journals & Planners',
    externalUrl: 'https://mysuccessplus.com/product/the-success-starts-here-journal',
    featured: true,
    description: '5" x 7" journal in black with 80 ruled pages, elastic closure, and ribbon bookmark',
  },
  {
    name: 'SUCCESS Magazine - March/April 2023 (Lewis Howes)',
    price: 9.99,
    image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/SM23_02_MARAPR_LEWIS_HOWES_NO_BARCODE_WEB_r1__33203-1.jpg',
    category: 'Magazines',
    externalUrl: 'https://mysuccessplus.com/shop',
    featured: true,
  },
];

async function importProducts() {
  console.log('🚀 Importing store products to database...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date().toISOString();
  let imported = 0;
  let skipped = 0;

  for (const product of storeProducts) {
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check if product already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  Skipping "${product.name}" (already exists)`);
      skipped++;
      continue;
    }

    // Insert product
    const { error } = await supabase.from('products').insert({
      id: nanoid(),
      title: product.name,
      slug,
      description: product.description || null,
      price: product.price,
      salePrice: product.salePrice || null,
      category: product.category,
      subcategory: product.subcategory || null,
      thumbnail: product.image,
      images: [product.image],
      externalUrl: product.externalUrl,
      isFeatured: product.featured || false,
      isPublished: true,
      stock: 999, // Digital products have unlimited stock
      salesCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    if (error) {
      console.error(`❌ Error importing "${product.name}":`, error.message);
    } else {
      console.log(`✅ Imported "${product.name}"`);
      imported++;
    }
  }

  console.log(`\n📊 Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${storeProducts.length}`);
}

importProducts().catch(console.error);
