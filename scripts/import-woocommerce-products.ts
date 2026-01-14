/**
 * Import WooCommerce products from CSV export
 * Maps old mysuccessplus.com products to new success.com store
 */
import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface WooCommerceProduct {
  ID: string;
  Type: string;
  SKU: string;
  Name: string;
  Published: string;
  'Is featured?': string;
  'Short description': string;
  Description: string;
  'Sale price': string;
  'Regular price': string;
  Categories: string;
  Tags: string;
  Images: string;
  'In stock?': string;
  Stock: string;
  'GTIN, UPC, EAN, or ISBN': string;
}

// Map WooCommerce categories to our store categories
function mapCategory(wooCategory: string, tags: string): string {
  const cat = wooCategory?.toLowerCase() || '';
  const tag = tags?.toLowerCase() || '';

  // Check for courses
  if (cat.includes('course') || tag.includes('course')) {
    return 'Courses';
  }

  // Check for magazines
  if (cat.includes('magazine') || tag.includes('magazine') || cat.includes('issue')) {
    return 'Magazines';
  }

  // Check for merchandise/apparel
  if (cat.includes('apparel') || cat.includes('merchandise') ||
      tag.includes('shirt') || tag.includes('cap') || tag.includes('mug') ||
      tag.includes('planner') || tag.includes('journal')) {
    return 'Merchandise';
  }

  // Check for bundles
  if (cat.includes('bundle') || tag.includes('bundle') || cat.includes('collection')) {
    return 'Bundles';
  }

  // Default to Books
  return 'Books';
}

// Map WooCommerce tags to subcategory
function mapSubcategory(tags: string, name: string): string | null {
  const tagLower = tags?.toLowerCase() || '';
  const nameLower = name?.toLowerCase() || '';

  // Jim Rohn products
  if (tagLower.includes('jim rohn') || nameLower.includes('jim rohn')) {
    return 'Jim Rohn';
  }

  // Zig Ziglar
  if (tagLower.includes('zig ziglar') || nameLower.includes('zig ziglar')) {
    return 'Success Classics';
  }

  // Napoleon Hill
  if (tagLower.includes('napoleon hill') || nameLower.includes('napoleon hill')) {
    return 'Success Classics';
  }

  // Og Mandino
  if (tagLower.includes('og mandino') || nameLower.includes('mandino')) {
    return 'Success Classics';
  }

  return null;
}

// Determine product type
function mapProductType(wooType: string, category: string): string {
  if (wooType === 'variable') {
    return 'physical'; // Most variable products are physical items
  }

  if (category === 'Courses') {
    return 'course';
  }

  if (category === 'Books') {
    return 'book';
  }

  if (category === 'Magazines') {
    return 'physical';
  }

  return 'physical';
}

// Clean HTML from description
function cleanHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Generate slug from product name
function generateSlug(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `/store/${slug}-${id}`;
}

async function importProducts(csvPath: string) {
  const supabase = supabaseAdmin();

  console.log('📦 Importing WooCommerce products from CSV...\n');
  console.log(`Reading: ${csvPath}\n`);

  // Read CSV file
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true, // Handle BOM
  }) as WooCommerceProduct[];

  console.log(`Found ${records.length} products in CSV\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches for better performance
  const BATCH_SIZE = 50;
  const productsToInsert: any[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      // Skip if no name or price
      if (!record.Name || !record['Regular price']) {
        skipped++;
        continue;
      }

      // Parse images
      const imageUrls = record.Images?.split(',').map(url => url.trim()).filter(url => url) || [];
      const mainImage = imageUrls[0] || 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/default.jpg';
      const galleryImages = imageUrls.slice(1);

      // Map category and subcategory
      const category = mapCategory(record.Categories, record.Tags);
      const subcategory = mapSubcategory(record.Tags, record.Name);
      const productType = mapProductType(record.Type, category);

      // Parse pricing
      const price = parseFloat(record['Regular price']) || 0;
      const salePrice = record['Sale price'] ? parseFloat(record['Sale price']) : null;

      // Determine if featured and active
      const featured = record['Is featured?'] === '1';
      const isActive = record['In stock?'] === '1' && record.Published !== '-1';

      // Clean descriptions
      const description = cleanHtml(record['Short description']).substring(0, 500);
      const longDescription = cleanHtml(record.Description);

      // Generate link
      const link = generateSlug(record.Name, record.ID);

      // Prepare product data
      const productData: any = {
        id: `woo-${record.ID}`,
        name: record.Name,
        price,
        sale_price: salePrice,
        image: mainImage,
        category,
        link,
        featured,
        is_active: isActive,
        display_order: imported + 1,
      };

      // Add optional fields only if they have values
      if (description) productData.description = description;
      if (longDescription) productData.long_description = longDescription;
      if (galleryImages.length > 0) productData.gallery_images = galleryImages;
      if (subcategory) productData.subcategory = subcategory;
      if (productType) productData.product_type = productType;
      if (productType === 'course' || productType === 'digital') productData.digital = true;
      if (record['GTIN, UPC, EAN, or ISBN']) productData.isbn = record['GTIN, UPC, EAN, or ISBN'];
      if (record.Stock) productData.inventory_count = parseInt(record.Stock);

      // Only add badge if the column exists (after migration)
      // if (featured) productData.badge = 'Featured';

      productsToInsert.push(productData);

      // Insert batch when we reach BATCH_SIZE or end of records
      if (productsToInsert.length >= BATCH_SIZE || i === records.length - 1) {
        const { error } = await supabase
          .from('store_products')
          .upsert(productsToInsert, { onConflict: 'id' });

        if (error) {
          console.error(`❌ Batch error:`, error.message);
          errors += productsToInsert.length;
        } else {
          imported += productsToInsert.length;
          console.log(`✅ Imported batch: ${imported}/${records.length} products`);
        }

        // Clear batch
        productsToInsert.length = 0;
      }

    } catch (err: any) {
      console.error(`❌ Failed to process "${record.Name}":`, err.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Import Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped:  ${skipped}`);
  console.log(`❌ Errors:   ${errors}`);
  console.log(`📦 Total:    ${records.length}`);
  console.log('='.repeat(60));
}

// Run if called directly
if (require.main === module) {
  const csvPath = process.argv[2] || 'C:\\Users\\RachelNead\\Downloads\\wc-product-export-14-1-2026-1768415997684.csv';

  importProducts(csvPath)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { importProducts };
