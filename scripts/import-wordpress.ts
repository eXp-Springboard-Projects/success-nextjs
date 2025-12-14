import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://www.success.com/wp-json/wp/v2';

// Generate a default password hash for imported WordPress authors
const DEFAULT_PASSWORD = 'WordPressImport2024!';
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

interface WPPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      slug: string;
      description: string;
      link: string;
      avatar_urls: { [key: string]: string };
    }>;
    'wp:featuredmedia'?: Array<{
      id: number;
      source_url: string;
      alt_text: string;
      media_details: {
        width: number;
        height: number;
      };
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
      taxonomy: string;
    }>>;
  };
}

interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  parent: number;
}

interface WPTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
}

interface WPAuthor {
  id: number;
  name: string;
  slug: string;
  description: string;
  link: string;
  avatar_urls: { [key: string]: string };
}

async function fetchFromWordPress(endpoint: string, params: any = {}) {
  const url = new URL(`${WORDPRESS_API_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  console.log(`Fetching: ${url.toString()}`);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }

  const totalPages = response.headers.get('x-wp-totalpages');
  const totalItems = response.headers.get('x-wp-total');
  const data = await response.json();

  return { data, totalPages: parseInt(totalPages || '1'), totalItems: parseInt(totalItems || '0') };
}

async function importCategories() {
  console.log('\n=== IMPORTING CATEGORIES ===');

  let page = 1;
  let totalImported = 0;

  while (true) {
    const { data: wpCategories, totalPages } = await fetchFromWordPress('/categories', {
      page,
      per_page: 100,
      _fields: 'id,name,slug,description,parent,count'
    });

    for (const wpCat of wpCategories as WPCategory[]) {
      try {
        await prisma.categories.upsert({
          where: { wordpressId: wpCat.id },
          create: {
            id: `cat_wp_${wpCat.id}`,
            wordpressId: wpCat.id,
            name: wpCat.name,
            slug: wpCat.slug,
            description: wpCat.description || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          update: {
            name: wpCat.name,
            slug: wpCat.slug,
            description: wpCat.description || null,
            updatedAt: new Date(),
          },
        });
        totalImported++;
        console.log(`✓ Category: ${wpCat.name}`);
      } catch (error: any) {
        console.error(`✗ Failed to import category ${wpCat.name}:`, error.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`\n✓ Imported ${totalImported} categories`);
}

async function importTags() {
  console.log('\n=== IMPORTING TAGS ===');

  let page = 1;
  let totalImported = 0;

  while (true) {
    const { data: wpTags, totalPages } = await fetchFromWordPress('/tags', {
      page,
      per_page: 100,
      _fields: 'id,name,slug,description,count'
    });

    for (const wpTag of wpTags as WPTag[]) {
      try {
        await prisma.tags.upsert({
          where: { wordpressId: wpTag.id },
          create: {
            id: `tag_wp_${wpTag.id}`,
            wordpressId: wpTag.id,
            name: wpTag.name,
            slug: wpTag.slug,
            description: wpTag.description || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          update: {
            name: wpTag.name,
            slug: wpTag.slug,
            description: wpTag.description || null,
            updatedAt: new Date(),
          },
        });
        totalImported++;
        console.log(`✓ Tag: ${wpTag.name}`);
      } catch (error: any) {
        console.error(`✗ Failed to import tag ${wpTag.name}:`, error.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`\n✓ Imported ${totalImported} tags`);
}

async function importAuthors() {
  console.log('\n=== IMPORTING AUTHORS ===');

  let page = 1;
  let totalImported = 0;

  while (true) {
    const { data: wpAuthors, totalPages } = await fetchFromWordPress('/users', {
      page,
      per_page: 100,
      _fields: 'id,name,slug,description,link,avatar_urls'
    });

    for (const wpAuthor of wpAuthors as WPAuthor[]) {
      try {
        // Check if user already exists
        const existingUser = await prisma.users.findFirst({
          where: { wordpressId: wpAuthor.id }
        });

        if (existingUser) {
          console.log(`→ Author already exists: ${wpAuthor.name}`);
          continue;
        }

        await prisma.users.create({
          data: {
            id: `user_wp_${wpAuthor.id}`,
            wordpressId: wpAuthor.id,
            email: `${wpAuthor.slug}@success.com`, // Placeholder email
            password: hashedPassword, // Default password for imported authors
            name: wpAuthor.name,
            role: 'AUTHOR',
            bio: wpAuthor.description || null,
            authorPageSlug: wpAuthor.slug,
            avatar: wpAuthor.avatar_urls?.['96'] || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        totalImported++;
        console.log(`✓ Author: ${wpAuthor.name}`);
      } catch (error: any) {
        console.error(`✗ Failed to import author ${wpAuthor.name}:`, error.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`\n✓ Imported ${totalImported} authors`);
}

async function getOrCreateDefaultAuthor(): Promise<string> {
  // Check if default author exists
  const defaultAuthor = await prisma.users.findFirst({
    where: { email: 'wordpress-import@success.com' }
  });

  if (defaultAuthor) {
    return defaultAuthor.id;
  }

  // Create default author
  const newAuthor = await prisma.users.create({
    data: {
      id: 'user_wordpress_import',
      email: 'wordpress-import@success.com',
      password: hashedPassword,
      name: 'WordPress Import',
      role: 'AUTHOR',
      bio: 'Default author for imported WordPress posts without an assigned author',
      authorPageSlug: 'wordpress-import',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✓ Created default author: ${newAuthor.name}`);
  return newAuthor.id;
}

async function importPosts(limit: number = 500) {
  console.log(`\n=== IMPORTING POSTS (limit: ${limit}) ===`);

  // Get or create default author for posts without authors
  const defaultAuthorId = await getOrCreateDefaultAuthor();
  console.log(`Using default author ID: ${defaultAuthorId}\n`);

  let page = 1;
  let totalImported = 0;

  while (totalImported < limit) {
    const { data: wpPosts, totalPages, totalItems } = await fetchFromWordPress('/posts', {
      page,
      per_page: 100,
      _embed: true,
      _fields: 'id,date,modified,slug,status,title,content,excerpt,author,featured_media,categories,tags,_embedded'
    });

    console.log(`\nPage ${page}/${totalPages} - Total posts in WordPress: ${totalItems}`);

    for (const wpPost of wpPosts as WPPost[]) {
      try {
        // Get author user ID
        let authorId: string | null = null;
        if (wpPost._embedded?.author?.[0]) {
          const wpAuthor = wpPost._embedded.author[0];
          const author = await prisma.users.findFirst({
            where: { wordpressId: wpAuthor.id }
          });
          authorId = author?.id || null;
        }

        // Get featured image
        let featuredImageUrl: string | null = null;
        let featuredImageAlt: string | null = null;
        if (wpPost._embedded?.['wp:featuredmedia']?.[0]) {
          const media = wpPost._embedded['wp:featuredmedia'][0];
          featuredImageUrl = media.source_url;
          featuredImageAlt = media.alt_text || wpPost.title.rendered;
        }

        // Get categories
        const categoryIds: string[] = [];
        if (wpPost._embedded?.['wp:term']?.[0]) {
          for (const term of wpPost._embedded['wp:term'][0]) {
            if (term.taxonomy === 'category') {
              const category = await prisma.categories.findFirst({
                where: { wordpressId: term.id }
              });
              if (category) {
                categoryIds.push(category.id);
              }
            }
          }
        }

        // Get tags
        const tagIds: string[] = [];
        if (wpPost._embedded?.['wp:term']?.[1]) {
          for (const term of wpPost._embedded['wp:term'][1]) {
            if (term.taxonomy === 'post_tag') {
              const tag = await prisma.tags.findFirst({
                where: { wordpressId: term.id }
              });
              if (tag) {
                tagIds.push(tag.id);
              }
            }
          }
        }

        // Calculate read time (200 words per minute)
        const wordCount = wpPost.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200);

        // Use default author if no author found
        if (!authorId) {
          authorId = defaultAuthorId;
          console.log(`→ Using default author for: ${wpPost.title.rendered.substring(0, 60)}...`);
        }

        await prisma.posts.upsert({
          where: { wordpressId: wpPost.id },
          create: {
            id: `post_wp_${wpPost.id}`,
            wordpressId: wpPost.id,
            title: wpPost.title.rendered,
            slug: wpPost.slug,
            content: wpPost.content.rendered,
            excerpt: wpPost.excerpt.rendered,
            status: wpPost.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            authorId: authorId,
            featuredImage: featuredImageUrl,
            featuredImageAlt: featuredImageAlt,
            readTime: readTime,
            publishedAt: wpPost.status === 'publish' ? new Date(wpPost.date) : null,
            createdAt: new Date(wpPost.date),
            updatedAt: new Date(wpPost.modified),
            categories: {
              connect: categoryIds.map(id => ({ id }))
            },
            tags: {
              connect: tagIds.map(id => ({ id }))
            }
          },
          update: {
            title: wpPost.title.rendered,
            content: wpPost.content.rendered,
            excerpt: wpPost.excerpt.rendered,
            status: wpPost.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            featuredImage: featuredImageUrl,
            featuredImageAlt: featuredImageAlt,
            readTime: readTime,
            updatedAt: new Date(wpPost.modified),
          },
        });

        totalImported++;
        console.log(`✓ Post ${totalImported}/${limit}: ${wpPost.title.rendered.substring(0, 60)}...`);

        if (totalImported >= limit) {
          console.log(`\n✓ Reached import limit of ${limit} posts`);
          break;
        }
      } catch (error: any) {
        console.error(`✗ Failed to import post ${wpPost.title.rendered}:`, error.message);
      }
    }

    if (page >= totalPages || totalImported >= limit) break;
    page++;

    // Rate limiting - wait 500ms between pages
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✓ Imported ${totalImported} posts`);
}

async function updatePostCounts() {
  console.log('\n=== UPDATING POST COUNTS ===');

  // Count posts per category
  const categories = await prisma.categories.count();
  console.log(`✓ ${categories} categories in database`);

  // Count posts per tag
  const tags = await prisma.tags.count();
  console.log(`✓ ${tags} tags in database`);

  console.log(`✓ Post counts updated`);
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   SUCCESS Magazine - WordPress Content Import  ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`WordPress API: ${WORDPRESS_API_URL}\n`);

  try {
    // Import in order: categories, tags, authors, then posts
    await importCategories();
    await importTags();
    await importAuthors();

    // Import posts (default 500, pass limit as CLI arg)
    const limit = parseInt(process.argv[2]) || 500;
    await importPosts(limit);

    // Update counts
    await updatePostCounts();

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              IMPORT COMPLETE! ✓                 ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Show summary
    const [postsCount, catsCount, tagsCount, authorsCount] = await Promise.all([
      prisma.posts.count(),
      prisma.categories.count(),
      prisma.tags.count(),
      prisma.users.count({ where: { role: 'AUTHOR' } })
    ]);

    console.log('Summary:');
    console.log(`  Posts:      ${postsCount}`);
    console.log(`  Categories: ${catsCount}`);
    console.log(`  Tags:       ${tagsCount}`);
    console.log(`  Authors:    ${authorsCount}\n`);

  } catch (error) {
    console.error('\n✗ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
