import { supabaseAdmin } from '../lib/supabase';

async function checkMagazineImages() {
  const supabase = supabaseAdmin();

  // Get all magazine products
  const { data: magazines, error } = await supabase
    .from('store_products')
    .select('id, name, category, image, gallery_images, is_active')
    .eq('category', 'Magazines')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching magazines:', error);
    return;
  }

  console.log(`\nFound ${magazines?.length || 0} magazine products:\n`);

  magazines?.forEach((mag) => {
    console.log(`ID: ${mag.id}`);
    console.log(`Name: ${mag.name}`);
    console.log(`Active: ${mag.is_active}`);
    console.log(`Image: ${mag.image || 'MISSING'}`);
    console.log(`Gallery Images: ${mag.gallery_images?.length || 0} images`);
    console.log('---');
  });

  // Check magazine_issues table for cover images
  const { data: issues, error: issuesError } = await supabase
    .from('magazine_issues')
    .select('*')
    .order('issue_date', { ascending: false })
    .limit(10);

  if (!issuesError && issues) {
    console.log(`\n\nFound ${issues.length} magazine issues:\n`);
    issues.forEach((issue) => {
      console.log(`Title: ${issue.title}`);
      console.log(`Issue Date: ${issue.issue_date}`);
      console.log(`Cover Image: ${issue.cover_image || 'MISSING'}`);
      console.log(`Digital PDF: ${issue.digital_pdf_url || 'MISSING'}`);
      console.log('---');
    });
  }
}

checkMagazineImages();
