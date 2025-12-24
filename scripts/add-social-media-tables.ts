/**
 * Add Social Media Auto-Poster Tables
 *
 * Creates tables for:
 * - social_accounts: Store connected social media accounts
 * - social_posts: Store scheduled and posted content
 * - social_post_results: Track posting results per platform
 */



const prisma = new PrismaClient();

async function addSocialMediaTables() {
  console.log('📱 Adding Social Media Auto-Poster tables...\n');

  try {
    // Create social_accounts table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        account_name VARCHAR(255),
        account_id VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        last_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, platform, account_id)
      );
    `;
    console.log('✅ Created social_accounts table');

    // Create social_posts table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS social_posts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        article_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        link_url TEXT,
        platforms TEXT[] NOT NULL,
        status VARCHAR(50) DEFAULT 'DRAFT',
        scheduled_at TIMESTAMP,
        posted_at TIMESTAMP,
        auto_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created social_posts table');

    // Create social_post_results table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS social_post_results (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        post_id TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        success BOOLEAN DEFAULT false,
        error_message TEXT,
        platform_post_id VARCHAR(255),
        platform_post_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created social_post_results table');

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON social_posts(scheduled_at);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_social_post_results_post_id ON social_post_results(post_id);
    `;
    console.log('✅ Created indexes');

    console.log('\n✅ Social Media tables created successfully!');
    console.log('\nTables added:');
    console.log('  • social_accounts - OAuth connections');
    console.log('  • social_posts - Scheduled and posted content');
    console.log('  • social_post_results - Posting results per platform');

  } catch (error: any) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addSocialMediaTables();
