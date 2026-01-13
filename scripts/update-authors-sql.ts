import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require'
});

async function updateAuthors() {
  const articles = [
    { slug: '4-benefits-of-having-a-pet-that-promotes-success', newAuthor: 'Jaclyn Greenberg' },
    { slug: 'mental-health-day-signs', newAuthor: 'Jaclyn Greenberg' }
  ];

  console.log('Updating article authors in database...\n');

  for (const article of articles) {
    try {
      const result = await pool.query(
        `UPDATE posts SET "authorName" = $1 WHERE slug = $2 RETURNING id, title, "authorName"`,
        [article.newAuthor, article.slug]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Updated: ${result.rows[0].title}`);
        console.log(`   Author: ${result.rows[0].authorName}\n`);
      } else {
        console.log(`❌ Not found: ${article.slug}\n`);
      }
    } catch (error: any) {
      console.log(`❌ Error updating ${article.slug}: ${error.message}\n`);
    }
  }

  await pool.end();
  console.log('Done!');
}

updateAuthors();
