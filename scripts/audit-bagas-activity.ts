import { supabaseAdmin } from '@/lib/supabase';

/**
 * SECURITY AUDIT: Check all activity by bagasramadhan88888@success.com
 *
 * This script checks:
 * 1. User profile and role
 * 2. Posts created/edited
 * 3. Pages created/edited
 * 4. Comments made
 * 5. Media uploads
 * 6. Any administrative actions
 */

async function auditUser() {
  const email = 'bagasramadhan88888@success.com';
  const supabase = supabaseAdmin();

  console.log('\n🔍 SECURITY AUDIT: Checking activity for', email);
  console.log('═'.repeat(80));

  try {
    // 1. Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('\n❌ Error fetching user:', userError.message);
      return;
    }

    if (!user) {
      console.log('\n✅ User NOT FOUND in database (may have been deleted)');
      return;
    }

    console.log('\n📋 USER PROFILE:');
    console.log('  ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Created:', user.createdAt);
    console.log('  Last Login:', user.lastLoginAt || 'Never');
    console.log('  Email Verified:', user.emailVerified);

    const userId = user.id;

    // 2. Check for posts created or edited
    console.log('\n📝 POSTS CREATED/EDITED:');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, slug, status, createdAt, updatedAt')
      .eq('authorId', userId);

    if (postsError) {
      console.log('  Error checking posts:', postsError.message);
    } else if (!posts || posts.length === 0) {
      console.log('  ✅ No posts created');
    } else {
      console.log(`  ⚠️  FOUND ${posts.length} posts:`);
      posts.forEach(post => {
        console.log(`    - ${post.title} (${post.status})`);
        console.log(`      Slug: /${post.slug}`);
        console.log(`      Created: ${post.createdAt}`);
      });
    }

    // 3. Check for pages created or edited
    console.log('\n📄 PAGES CREATED/EDITED:');
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, title, slug, status, createdAt, updatedAt')
      .eq('authorId', userId);

    if (pagesError) {
      console.log('  Error checking pages:', pagesError.message);
    } else if (!pages || pages.length === 0) {
      console.log('  ✅ No pages created');
    } else {
      console.log(`  ⚠️  FOUND ${pages.length} pages:`);
      pages.forEach(page => {
        console.log(`    - ${page.title} (${page.status})`);
        console.log(`      Slug: /${page.slug}`);
        console.log(`      Created: ${page.createdAt}`);
      });
    }

    // 4. Check for media uploads
    console.log('\n🖼️  MEDIA UPLOADS:');
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('id, filename, url, mimeType, createdAt')
      .eq('uploadedBy', userId);

    if (mediaError) {
      console.log('  Error checking media:', mediaError.message);
    } else if (!media || media.length === 0) {
      console.log('  ✅ No media uploaded');
    } else {
      console.log(`  ⚠️  FOUND ${media.length} files:`);
      media.forEach(file => {
        console.log(`    - ${file.filename} (${file.mimeType})`);
        console.log(`      URL: ${file.url}`);
        console.log(`      Uploaded: ${file.createdAt}`);
      });
    }

    // 5. Check activity log
    console.log('\n📊 ACTIVITY LOG:');
    const { data: activities, error: activityError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (activityError) {
      console.log('  Error checking activities:', activityError.message);
    } else if (!activities || activities.length === 0) {
      console.log('  ✅ No logged activities');
    } else {
      console.log(`  ⚠️  FOUND ${activities.length} activities (showing last 10):`);
      activities.slice(0, 10).forEach(activity => {
        console.log(`    - ${activity.action} - ${activity.description}`);
        console.log(`      IP: ${activity.ipAddress || 'N/A'} | ${activity.createdAt}`);
      });
    }

    // 6. Check for admin actions
    console.log('\n🔐 ADMINISTRATIVE ACTIONS:');
    const { data: adminActions, error: adminError } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (adminError) {
      console.log('  Error checking admin actions:', adminError.message);
    } else if (!adminActions || adminActions.length === 0) {
      console.log('  ✅ No admin actions performed');
    } else {
      console.log(`  ⚠️  FOUND ${adminActions.length} admin actions:`);
      adminActions.forEach(action => {
        console.log(`    - ${action.action} on ${action.resourceType}`);
        console.log(`      Details: ${action.details}`);
        console.log(`      Timestamp: ${action.createdAt}`);
      });
    }

    // 7. Check for staff departments assigned
    console.log('\n🏢 DEPARTMENT ASSIGNMENTS:');
    const { data: departments, error: deptError } = await supabase
      .from('staff_departments')
      .select('*')
      .eq('userId', userId);

    if (deptError) {
      console.log('  Error checking departments:', deptError.message);
    } else if (!departments || departments.length === 0) {
      console.log('  ✅ No departments assigned');
    } else {
      console.log(`  ⚠️  Assigned to ${departments.length} departments:`);
      departments.forEach(dept => {
        console.log(`    - ${dept.department}`);
      });
    }

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 AUDIT SUMMARY:');
    console.log(`  User Account: ${user.name} (${user.email})`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Posts Created: ${posts?.length || 0}`);
    console.log(`  Pages Created: ${pages?.length || 0}`);
    console.log(`  Media Uploaded: ${media?.length || 0}`);
    console.log(`  Activities Logged: ${activities?.length || 0}`);
    console.log(`  Admin Actions: ${adminActions?.length || 0}`);

    if ((posts?.length || 0) > 0 || (pages?.length || 0) > 0 || (media?.length || 0) > 0 || (adminActions?.length || 0) > 0) {
      console.log('\n⚠️  WARNING: This user has made changes to the site!');
      console.log('   Review the details above before deletion.');
    } else {
      console.log('\n✅ SAFE TO DELETE: No content or changes detected.');
    }
    console.log('═'.repeat(80) + '\n');

  } catch (error: any) {
    console.error('\n❌ Audit failed:', error.message);
  }
}

auditUser().catch(console.error);
