/**
 * Import ALL WordPress Content to Supabase
 * Posts, Media, Categories, Tags, Authors
 */

import pkg from 'pg';
const { Client } = pkg;
import * as bcrypt from 'bcryptjs';

const WORDPRESS_API_URL = 'https://successcom.wpenginepowered.com/wp-json/wp/v2';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

const DEFAULT_PASSWORD = bcrypt.hashSync('WordPressImport2024!', 10);

async function fetchWP(endpoint: string, params: any = {}): Promise<any> {
  const url = new URL(`${WORDPRESS_API_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return { data: [], totalPages: 0, totalItems: 0 };

    const totalPages = response.headers.get('x-wp-totalpages');
    const totalItems = response.headers.get('x-wp-total');
    const data = await response.json();

    return { data, totalPages: parseInt(totalPages || '1'), totalItems: parseInt(totalItems || '0') };
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return { data: [], totalPages: 0, totalItems: 0 };
  }
}

async function importCategories(client: any) {
  console.log('\n=== IMPORTING CATEGORIES ===');
  let page = 1, totalImported = 0;

  while (true) {
    const { data: categories, totalPages } = await fetchWP('/categories', { page, per_page: 100 });
    if (!categories || categories.length === 0) break;

    for (const cat of categories) {
      try {
        await client.query(
          `INSERT INTO categories (id, name, slug, description, "wordpressId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT ("wordpressId") DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             "updatedAt" = NOW()`,
          [`cat_wp_${cat.id}`, cat.name, cat.slug, cat.description || null, cat.id]
        );
        totalImported++;
        console.log(`✓ Category: ${cat.name}`);
      } catch (err: any) {
        console.error(`✗ ${cat.name}:`, err.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`✓ Imported ${totalImported} categories`);
  return totalImported;
}

async function importTags(client: any) {
  console.log('\n=== IMPORTING TAGS ===');
  let page = 1, totalImported = 0;

  while (true) {
    const { data: tags, totalPages } = await fetchWP('/tags', { page, per_page: 100 });
    if (!tags || tags.length === 0) break;

    for (const tag of tags) {
      try {
        await client.query(
          `INSERT INTO tags (id, name, slug, description, "wordpressId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT ("wordpressId") DO UPDATE SET
             name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             description = EXCLUDED.description,
             "updatedAt" = NOW()`,
          [`tag_wp_${tag.id}`, tag.name, tag.slug, tag.description || null, tag.id]
        );
        totalImported++;
        if (totalImported % 50 === 0) console.log(`✓ ${totalImported} tags...`);
      } catch (err: any) {
        console.error(`✗ ${tag.name}:`, err.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`✓ Imported ${totalImported} tags`);
  return totalImported;
}

async function importAuthors(client: any) {
  console.log('\n=== IMPORTING AUTHORS ===');
  let page = 1, totalImported = 0;

  while (true) {
    const { data: authors, totalPages } = await fetchWP('/users', { page, per_page: 100 });
    if (!authors || authors.length === 0) break;

    for (const author of authors) {
      try {
        // Check if exists
        const check = await client.query('SELECT id FROM users WHERE "wordpressId" = $1', [author.id]);
        if (check.rows.length > 0) continue;

        await client.query(
          `INSERT INTO users (id, "wordpressId", email, password, name, role, bio, "authorPageSlug", avatar, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [
            `user_wp_${author.id}`,
            author.id,
            `${author.slug}@success.com`,
            DEFAULT_PASSWORD,
            author.name,
            'AUTHOR',
            author.description || null,
            author.slug,
            author.avatar_urls?.['96'] || null
          ]
        );
        totalImported++;
        console.log(`✓ Author: ${author.name}`);
      } catch (err: any) {
        console.error(`✗ ${author.name}:`, err.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`✓ Imported ${totalImported} authors`);
  return totalImported;
}

async function importPosts(client: any, limit: number = 10000) {
  console.log(`\n=== IMPORTING POSTS (limit: ${limit}) ===`);

  // Get default author
  let defaultAuthorId = 'user_wordpress_import';
  const check = await client.query('SELECT id FROM users WHERE id = $1', [defaultAuthorId]);

  if (check.rows.length === 0) {
    await client.query(
      `INSERT INTO users (id, email, password, name, role, bio, "authorPageSlug", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [defaultAuthorId, 'wordpress-import@success.com', DEFAULT_PASSWORD, 'WordPress Import', 'AUTHOR', 'Default author', 'wordpress-import']
    );
    console.log('✓ Created default author\n');
  }

  let page = 1, totalImported = 0;

  while (totalImported < limit) {
    const { data: posts, totalPages, totalItems } = await fetchWP('/posts', {
      page,
      per_page: 100,
      _embed: true
    });

    console.log(`\nPage ${page}/${totalPages} - Total: ${totalItems}`);
    if (!posts || posts.length === 0) break;

    for (const post of posts) {
      try {
        // Get author ID
        let authorId = defaultAuthorId;
        let authorName = null;

        if (post._embedded?.author?.[0]) {
          authorName = post._embedded.author[0].name;
          const authorResult = await client.query(
            'SELECT id FROM users WHERE "wordpressId" = $1',
            [post._embedded.author[0].id]
          );
          if (authorResult.rows.length > 0) {
            authorId = authorResult.rows[0].id;
          }
        }

        // Get featured image
        let featuredImage = null;
        let featuredImageAlt = null;
        if (post._embedded?.['wp:featuredmedia']?.[0]) {
          featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
          featuredImageAlt = post._embedded['wp:featuredmedia'][0].alt_text || post.title.rendered;
        }

        // Calculate read time
        const wordCount = post.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200);

        await client.query(
          `INSERT INTO posts (
            id, "wordpressId", title, slug, content, excerpt, status, "authorId", "authorName", "wordpressAuthor",
            "featuredImage", "featuredImageAlt", "readTime", "publishedAt", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT ("wordpressId") DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            excerpt = EXCLUDED.excerpt,
            status = EXCLUDED.status,
            "featuredImage" = EXCLUDED."featuredImage",
            "featuredImageAlt" = EXCLUDED."featuredImageAlt",
            "readTime" = EXCLUDED."readTime",
            "updatedAt" = EXCLUDED."updatedAt"`,
          [
            `post_wp_${post.id}`,
            post.id,
            post.title.rendered,
            post.slug,
            post.content.rendered,
            post.excerpt.rendered,
            post.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            authorId,
            authorName,
            authorName,
            featuredImage,
            featuredImageAlt,
            readTime,
            post.status === 'publish' ? new Date(post.date) : null,
            new Date(post.date),
            new Date(post.modified)
          ]
        );

        totalImported++;
        if (totalImported % 50 === 0) console.log(`✓ ${totalImported} posts imported...`);

        if (totalImported >= limit) break;
      } catch (err: any) {
        console.error(`✗ Post error:`, err.message);
      }
    }

    if (page >= totalPages || totalImported >= limit) break;
    page++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✓ Imported ${totalImported} posts`);
  return totalImported;
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   WordPress Content Import to Supabase         ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    const stats = {
      categories: await importCategories(client),
      tags: await importTags(client),
      authors: await importAuthors(client),
      posts: await importPosts(client, parseInt(process.argv[2]) || 10000)
    };

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║          IMPORT COMPLETE!                      ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log(`Categories: ${stats.categories}`);
    console.log(`Tags:       ${stats.tags}`);
    console.log(`Authors:    ${stats.authors}`);
    console.log(`Posts:      ${stats.posts}\n`);

  } catch (error: any) {
    console.error('✗ Import failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
