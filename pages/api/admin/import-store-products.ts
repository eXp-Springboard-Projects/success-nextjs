import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// All products from the SUCCESS Store
const storeProducts = [
  // FEATURED BUNDLES
  { name: 'Jim Rohn Book Bundle', price: 181.69, salePrice: 97.00, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/e/848/jr_book-bundle__68973.jpg', category: 'Bundles', link: 'https://mysuccessplus.com/shop', featured: true, displayOrder: 1 },

  // BOOKS - Jim Rohn Collection
  { name: 'The Five Major Pieces to the Life Puzzle', price: 24.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/i/808/jr010-002__12948.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/five-major-pieces-life-puzzle', featured: false, displayOrder: 10 },
  { name: 'The Seasons of Life', price: 19.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/n/765/jr010-008_1_1__09293.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/seasons-of-life', featured: false, displayOrder: 11 },
  { name: 'Twelve Pillars', price: 22.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/f/057/jr010-010_1__00354.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/twelve-pillars', featured: false, displayOrder: 12 },
  { name: 'Leading an Inspired Life', price: 29.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/w/124/jr010-004__26100.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/leading-an-inspired-life', featured: true, displayOrder: 2 },
  { name: '7 Strategies for Wealth & Happiness', price: 26.99, image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/jr010-007__74951-1.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/7-strategies-wealth-happiness', featured: false, displayOrder: 13 },
  { name: 'The Art of Exceptional Living', price: 24.99, image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/The_Art_of_Exceptinal_Living_MP3_product_image__39905-1.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/art-of-exceptional-living', featured: false, displayOrder: 14 },
  { name: 'The Treasury of Quotes', price: 19.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/z/244/jr-thetreasuryofquotes-lg__76474.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/treasury-of-quotes', featured: false, displayOrder: 15 },
  { name: 'My Philosophy for Successful Living', price: 22.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/h/235/jr010-006__17735.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/my-philosophy-successful-living', featured: false, displayOrder: 16 },
  { name: 'The Challenge to Succeed', price: 21.99, image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/sm24-04-july-aug-featured-1.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/challenge-to-succeed', featured: false, displayOrder: 17 },
  { name: 'Building Your Network Marketing Business', price: 23.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/x/826/jr010-009_1__98084.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/network-marketing-business', featured: false, displayOrder: 18 },

  // Success Classics
  { name: 'Think and Grow Rich by Napoleon Hill', price: 24.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/n/548/nh_think-and-grow-rich_new__85964.jpg', category: 'Books', subcategory: 'Success Classics', link: 'https://mysuccessplus.com/product/think-and-grow-rich-by-napoleon-hill', featured: true, displayOrder: 3 },
  { name: 'The Greatest Salesman in the World by Og Mandino', price: 19.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/a/279/Greatest_Salesman_in_the_World_Mandino__90526.jpg', category: 'Books', subcategory: 'Success Classics', link: 'https://mysuccessplus.com/product/the-greatest-salesman-in-the-world-by-og-mandino', featured: false, displayOrder: 19 },
  { name: 'Tough Times Never Last, But Tough People Do! by Robert Schuller', price: 17.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/n/172/Tough_Times_Never_Last__23131.gif', category: 'Books', subcategory: 'Success Classics', link: 'https://mysuccessplus.com/product/tough-times-never-last-but-tough-people-do-by-robert-schuller', featured: false, displayOrder: 20 },
  { name: 'Excerpts from The Treasury of Quotes by Jim Rohn', price: 14.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/d/062/JR_Excerpts_Treasury-of-Quotes_3D__71061.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/product/excerpts-from-the-treasury-of-quotes-by-jim-rohn', featured: false, displayOrder: 21 },
  { name: "Zig Ziglar's Little Book of Big Quotes", price: 16.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/n/303/ZZ_Little-Book-of-Big-Quotes-zz010-001_1__15635.jpg', category: 'Books', subcategory: 'Success Classics', link: 'https://mysuccessplus.com/product/zig-ziglars-little-book-of-big-quotes', featured: false, displayOrder: 22 },
  { name: 'The Jim Rohn Guides Complete Set', price: 18.71, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/s/745/jr_complete-guide-set-3d__33414.jpg', category: 'Books', subcategory: 'Jim Rohn', link: 'https://mysuccessplus.com/shop/jim-rohn-guides-complete-set', featured: false, displayOrder: 23 },

  // MERCHANDISE
  { name: 'The SUCCESS Starts Here Journal', price: 14.99, salePrice: 9.71, image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/S23_Journal_SUCCESS-STARTS-HERE__48992-1.png', category: 'Merchandise', subcategory: 'Journals & Planners', link: 'https://mysuccessplus.com/shop/success-starts-here-journal', featured: true, displayOrder: 4 },
  { name: 'Jim Rohn One-Year Success Planner', price: 29.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/z/364/JRohn_One_Year_Success_Planner_strapped__74510.png', category: 'Merchandise', subcategory: 'Journals & Planners', link: 'https://mysuccessplus.com/shop/jim-rohn-success-planner', featured: false, displayOrder: 30 },
  { name: 'SUCCESS EST. 1897 Stone Cap', price: 24.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/e/954/classic-dad-hat-stone-right-front-61b11d77c8aff__69810.jpg', category: 'Merchandise', subcategory: 'Apparel', link: 'https://mysuccessplus.com/product/success-est-1897-stone-cap', featured: false, displayOrder: 31 },
  { name: 'SUCCESS Classic Covers 15-oz. Ceramic Mug', price: 16.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/o/026/white-glossy-mug-15oz-handle-on-left-6192b05a894a2__67579.jpg', category: 'Merchandise', subcategory: 'Drinkware', link: 'https://mysuccessplus.com/product/success-classic-covers-15-oz-ceramic-mug', featured: false, displayOrder: 32 },
  { name: 'Treasury of Quotes Booklet by Chris Widener', price: 9.99, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/l/207/p1862__84751.jpg', category: 'Merchandise', subcategory: 'Office Supplies', link: 'https://mysuccessplus.com/product/treasury-of-quotes-booklet-by-chris-widener', featured: false, displayOrder: 33 },
  { name: 'The Jim Rohn Guide to Goal Setting', price: 9.37, image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/k/575/jr_guide-to-goal-setting-3d__10764.jpg', category: 'Merchandise', subcategory: 'Office Supplies', link: 'https://mysuccessplus.com/product/the-jim-rohn-guide-to-goal-setting', featured: false, displayOrder: 34 },

  // MAGAZINES
  { name: 'SUCCESS Magazine - January/February 2026 (Dean and Lisa Graziosi)', price: 9.99, image: 'https://mysuccessplus.com/wp-content/uploads/2025/11/SM26_JAN-FEB-COVER-DEAN-LISA-GRAZIOSI_NO-BARCODE_WEB.jpg', category: 'Magazines', link: 'https://mysuccessplus.com/product/success-magazine-january-february-2026-dean-and-lisa-graziosi', featured: true, displayOrder: 5 },
  { name: 'SUCCESS Magazine - March/April 2023 (Lewis Howes)', price: 9.99, image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/SM23_02_MARAPR_LEWIS_HOWES_NO_BARCODE_WEB_r1__33203-1.jpg', category: 'Magazines', link: 'https://mysuccessplus.com/shop/success-magazine-mar-apr-2023', featured: true, displayOrder: 6 },
  { name: 'SUCCESS Magazine - September/October 2024', price: 9.99, image: 'https://mysuccessplus.com/wp-content/uploads/2024/09/SUCCESS-SeptOct-2024-Shark-Tank-Digital-Cover.jpg', category: 'Magazines', link: 'https://mysuccessplus.com/shop/success-magazine-sept-oct-2024', featured: false, displayOrder: 40 },
  { name: 'SUCCESS Magazine - July/August 2024', price: 9.99, image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/sm24-04-july-aug-featured-1.jpg', category: 'Magazines', link: 'https://mysuccessplus.com/shop/success-magazine-july-aug-2024', featured: false, displayOrder: 41 },
  { name: 'SUCCESS Magazine - May/June 2024', price: 9.99, image: 'https://mysuccessplus.com/wp-content/uploads/2024/05/SUCCESS-MayJun-2024-Bethany-Hamilton-Digital-Cover.jpg', category: 'Magazines', link: 'https://mysuccessplus.com/shop/success-magazine-may-jun-2024', featured: false, displayOrder: 42 },
  { name: 'SUCCESS Magazine - March/April 2024', price: 9.99, image: 'https://mysuccessplus.com/wp-content/uploads/2024/03/SUCCESS-MarApr-2024-Emily-Calandrelli-Digital-Cover.jpg', category: 'Magazines', link: 'https://mysuccessplus.com/shop/success-magazine-mar-apr-2024', featured: false, displayOrder: 43 },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  // Only super admins can import products
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email as string)
    .single();

  if (!user || userError || user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Super Admin access required' });
  }

  try {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of storeProducts) {
      try {
        // Check if product already exists by name
        const { data: existing } = await supabase
          .from('store_products')
          .select('id')
          .eq('name', product.name)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Insert product
        const { error } = await supabase.from('store_products').insert({
          id: uuidv4(),
          name: product.name,
          price: product.price,
          sale_price: (product as any).salePrice || null,
          image: product.image,
          category: product.category,
          subcategory: (product as any).subcategory || null,
          link: product.link,
          featured: product.featured || false,
          display_order: (product as any).displayOrder || 0,
          is_active: true,
        });

        if (error) {
          console.error(`Error importing "${product.name}":`, error);
          errors++;
        } else {
          imported++;
        }
      } catch (err) {
        console.error(`Exception importing "${product.name}":`, err);
        errors++;
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      userId: user.id,
      action: 'IMPORT_STORE_PRODUCTS',
      entity: 'store_products',
      entityId: 'bulk-import',
      details: `Imported ${imported} products, skipped ${skipped}, errors ${errors}`,
    });

    return res.status(200).json({
      success: true,
      imported,
      skipped,
      errors,
      total: storeProducts.length,
      message: `Successfully imported ${imported} products. ${skipped} already existed. ${errors} errors.`
    });
  } catch (error) {
    console.error('Error importing store products:', error);
    return res.status(500).json({ error: 'Failed to import products' });
  }
}
