/**
 * Automated Prisma to Supabase Conversion Script
 *
 * This script converts all remaining files that import from '@prisma/client'
 * to use Supabase instead.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const ROOT_DIR = path.join(__dirname, '..');

// Files to skip
const SKIP_FILES = [
  'node_modules',
  '.next',
  'out',
  '.md',
  '.backup',
  'CONVERSION',
  'MIGRATION',
  'PROGRESS',
  'IMPLEMENTATION',
  'success-plus-work',
  'CUsers', // Backup files with weird paths
];

// Mapping of Prisma table names to Supabase snake_case
const FIELD_MAPPINGS: Record<string, string> = {
  // Common field mappings
  'firstName': 'first_name',
  'lastName': 'last_name',
  'stripeCustomerId': 'stripe_customer_id',
  'stripeSubscriptionId': 'stripe_subscription_id',
  'stripePriceId': 'stripe_price_id',
  'currentPeriodStart': 'current_period_start',
  'currentPeriodEnd': 'current_period_end',
  'cancelAtPeriodEnd': 'cancel_at_period_end',
  'membershipTier': 'membership_tier',
  'membershipStatus': 'membership_status',
  'memberId': 'member_id',
  'userId': 'user_id',
  'authorId': 'author_id',
  'postId': 'post_id',
  'categoryId': 'category_id',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'publishedAt': 'published_at',
  'deletedAt': 'deleted_at',
  'lastLoginAt': 'last_login_at',
  'emailVerified': 'email_verified',
  'resetToken': 'reset_token',
  'resetTokenExpiry': 'reset_token_expiry',
  'emailVerificationToken': 'email_verification_token',
  'hasChangedDefaultPassword': 'has_changed_default_password',
  'inviteCode': 'invite_code',
  'invitedBy': 'invited_by',
  'authorPageSlug': 'author_page_slug',
  'jobTitle': 'job_title',
  'socialFacebook': 'social_facebook',
  'socialLinkedin': 'social_linkedin',
  'socialTwitter': 'social_twitter',
  'wordpressId': 'wordpress_id',
  'wordpressSlug': 'wordpress_slug',
  'wordpressAuthor': 'wordpress_author',
  'onboardingCompleted': 'onboarding_completed',
  'isActive': 'is_active',
  'primaryDepartment': 'primary_department',
  'linkedMemberId': 'linked_member_id',
  'trialEndsAt': 'trial_ends_at',
  'trialStartedAt': 'trial_started_at',
  'joinDate': 'join_date',
  'lastLoginDate': 'last_login_date',
  'totalSpent': 'total_spent',
  'lifetimeValue': 'lifetime_value',
  'engagementScore': 'engagement_score',
  'billingAddress': 'billing_address',
  'shippingAddress': 'shipping_address',
  'communicationPreferences': 'communication_preferences',
  'assignedCSRep': 'assigned_cs_rep',
  'internalNotes': 'internal_notes',
  'paykickstartCustomerId': 'paykickstart_customer_id',
  'woocommerceCustomerId': 'woocommerce_customer_id',
  'lastContactDate': 'last_contact_date',
  'priorityLevel': 'priority_level',
  'featuredImage': 'featured_image',
  'featuredImageAlt': 'featured_image_alt',
  'featuredImageCaption': 'featured_image_caption',
  'seoTitle': 'seo_title',
  'seoDescription': 'seo_description',
  'readTime': 'read_time',
  'canonicalUrl': 'canonical_url',
  'customExcerpt': 'custom_excerpt',
  'metaKeywords': 'meta_keywords',
  'parentId': 'parent_id',
  'postCount': 'post_count',
  'lastContactedAt': 'last_contacted_at',
  'emailEngagementScore': 'email_engagement_score',
  'leadScore': 'lead_score',
  'templateId': 'template_id',
  'scheduledAt': 'scheduled_at',
  'sentAt': 'sent_at',
  'totalSent': 'total_sent',
  'totalOpened': 'total_opened',
  'totalClicked': 'total_clicked',
  'sentCount': 'sent_count',
  'deliveredCount': 'delivered_count',
  'openedCount': 'opened_count',
  'clickedCount': 'clicked_count',
  'bouncedCount': 'bounced_count',
  'failedCount': 'failed_count',
  'sendErrors': 'send_errors',
  'orderNumber': 'order_number',
  'userName': 'user_name',
  'userEmail': 'user_email',
  'paymentMethod': 'payment_method',
  'paymentId': 'payment_id',
  'orderSource': 'order_source',
  'woocommerceOrderId': 'woocommerce_order_id',
  'fulfillmentStatus': 'fulfillment_status',
  'fulfilledAt': 'fulfilled_at',
  'fulfilledBy': 'fulfilled_by',
  'trackingNumber': 'tracking_number',
  'trackingCarrier': 'tracking_carrier',
  'trackingUrl': 'tracking_url',
  'packingSlipPrinted': 'packing_slip_printed',
  'customerNotes': 'customer_notes',
  'deliveredDate': 'delivered_date',
  'shippedDate': 'shipped_date',
  'paykickstartSubscriptionId': 'paykickstart_subscription_id',
  'billingCycle': 'billing_cycle',
  'displayOrder': 'display_order',
  'actionUrl': 'action_url',
  'isRead': 'is_read',
  'expiresAt': 'expires_at',
  'readAt': 'read_at',
  'targetAudience': 'target_audience',
  'isPinned': 'is_pinned',
  'createdBy': 'created_by',
  'linkUrl': 'link_url',
  'linkText': 'link_text',
  'paymentMethod': 'payment_method',
  'providerTxnId': 'provider_txn_id',
};

function shouldSkipFile(filePath: string): boolean {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

function convertFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // Skip if already converted
    if (content.includes('from \'../../lib/supabase\'') ||
        content.includes('from \'../../../lib/supabase\'') ||
        content.includes('from \'../../../../lib/supabase\'')) {
      console.log(`⏭️  Skipping (already converted): ${filePath}`);
      return false;
    }

    // Check if file has Prisma imports
    if (!content.includes('from \'@prisma/client\'')) {
      console.log(`⏭️  Skipping (no Prisma imports): ${filePath}`);
      return false;
    }

    console.log(`🔄 Converting: ${filePath}`);

    // Replace PrismaClient import with supabaseAdmin
    const oldImport = /import\s+\{\s*PrismaClient(?:\s*,\s*([^}]+))?\s*\}\s+from\s+['"]@prisma\/client['"]/g;
    content = content.replace(oldImport, (match, typeImports) => {
      hasChanges = true;
      const libPath = filePath.includes('pages/api') ? '../../lib/supabase' :
                     filePath.includes('scripts') ? '../lib/supabase' :
                     '../../lib/supabase';

      let result = `import { supabaseAdmin } from '${libPath}'`;

      // If there were type imports, convert them
      if (typeImports) {
        const types = typeImports.split(',').map(t => t.trim());
        const typePath = libPath.replace('/supabase', '/types');
        result += `\nimport { ${types.join(', ')} } from '${typePath}'`;
      }

      return result;
    });

    // Remove standalone Prisma Client instantiations
    content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\);?\n?/g, () => {
      hasChanges = true;
      return '';
    });

    // Replace prisma method calls with supabase equivalents
    // This is a basic conversion - complex queries may need manual review

    // Add supabase initialization in functions if needed
    const functionRegex = /(async\s+function\s+\w+\s*\([^)]*\)\s*\{)/g;
    content = content.replace(functionRegex, (match) => {
      // Only add if prisma is used in this file and supabase isn't already defined
      if (content.includes('prisma.') && !match.includes('supabase =')) {
        hasChanges = true;
        return `${match}\n  const supabase = supabaseAdmin();`;
      }
      return match;
    });

    // Note: Full conversion of prisma.table.method() calls would be extremely complex
    // The remaining conversions should be done manually or with more sophisticated AST parsing

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Converted: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Prisma to Supabase conversion...\n');

  // Find all TypeScript and JavaScript files
  const pattern = path.join(ROOT_DIR, '**/*.{ts,tsx,js,jsx}');
  const files = await glob(pattern, {
    ignore: ['**/node_modules/**', '**/.next/**', '**/out/**'],
  });

  const filesToConvert = files.filter(file => !shouldSkipFile(file));

  console.log(`Found ${filesToConvert.length} files to check\n`);

  let convertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const file of filesToConvert) {
    const result = convertFile(file);
    if (result) {
      convertedCount++;
    } else if (result === false) {
      skippedCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n📊 Conversion Summary:');
  console.log(`✅ Converted: ${convertedCount} files`);
  console.log(`⏭️  Skipped: ${skippedCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  console.log('\n⚠️  Note: This script only handles import conversions.');
  console.log('   Manual review is required for prisma.table.method() calls.');
}

main().catch(console.error);
