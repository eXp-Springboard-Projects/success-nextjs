/**
 * Complete WordPress Content Scraper
 * Scrapes ALL content from https://successcom.wpenginepowered.com/
 * Imports to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

const WORDPRESS_API_URL = 'https://successcom.wpenginepowered.com/wp-json/wp/v2';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable not set');
  process.exit(1);
}

// Parse Supabase connection from DATABASE_URL
const dbUrl = new URL(DATABASE_URL);
const supabaseUrl = `https://${dbUrl.hostname.split('.')[0]}.supabase.co`;
const supabaseKey = dbUrl.password;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

// Default password for imported WordPress authors
const DEFAULT_PASSWORD = bcrypt.hashSync('WordPressImport2024!', 10);

interface WPPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: any;
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
}

interface WPTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

interface WPAuthor {
  id: number;
  name: string;
  slug: string;
  description: string;
  avatar_urls: { [key: string]: string };
}

interface WPMedia {
  id: number;
  title: { rendered: string };
  source_url: string;
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    filesize?: number;
  };
}

async function fetchFromWordPress(endpoint: string, params: any = {}): Promise<any> {
  const url = new URL(`${WORDPRESS_API_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  console.log(`Fetching: ${endpoint} (page ${params.page || 1})`);

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(`WordPress API error: ${response.status} ${response.statusText}`);
    return { data: [], totalPages: 0, totalItems: 0 };
  }

  const totalPages = response.headers.get('x-wp-totalpages');
  const totalItems = response.headers.get('x-wp-total');
  const data = await response.json();

  return {
    data,
    totalPages: parseInt(totalPages || '1'),
    totalItems: parseInt(totalItems || '0')
  };
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

    if (!wpCategories || wpCategories.length === 0) break;

    for (const wpCat of wpCategories as WPCategory[]) {
      try {
        const { error } = await supabase
          .from('categories')
          .upsert({
            id: `cat_wp_${wpCat.id}`,
            name: wpCat.name,
            slug: wpCat.slug,
            description: wpCat.description || null,
            wordpressId: wpCat.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, {
            onConflict: 'wordpressId'
          });

        if (error) {
          console.error(`✗ Category error: ${wpCat.name}`, error.message);
        } else {
          totalImported++;
          console.log(`✓ Category: ${wpCat.name} (${wpCat.count} posts)`);
        }
      } catch (error: any) {
        console.error(`✗ Failed to import category ${wpCat.name}:`, error.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`\n✓ Imported ${totalImported} categories`);
  return totalImported;
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

    if (!wpTags || wpTags.length === 0) break;

    for (const wpTag of wpTags as WPTag[]) {
      try {
        const { error } = await supabase
          .from('tags')
          .upsert({
            id: `tag_wp_${wpTag.id}`,
            name: wpTag.name,
            slug: wpTag.slug,
            description: wpTag.description || null,
            wordpressId: wpTag.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, {
            onConflict: 'wordpressId'
          });

        if (error) {
          console.error(`✗ Tag error: ${wpTag.name}`, error.message);
        } else {
          totalImported++;
          console.log(`✓ Tag: ${wpTag.name}`);
        }
      } catch (error: any) {
        console.error(`✗ Failed to import tag ${wpTag.name}:`, error.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`\n✓ Imported ${totalImported} tags`);
  return totalImported;
}

async function importAuthors() {
  console.log('\n=== IMPORTING AUTHORS ===');

  let page = 1;
  let totalImported = 0;

  while (true) {
    const { data: wpAuthors, totalPages } = await fetchFromWordPress('/users', {
      page,
      per_page: 100,
      _fields: 'id,name,slug,description,avatar_urls'
    });

    if (!wpAuthors || wpAuthors.length === 0) break;

    for (const wpAuthor of wpAuthors as WPAuthor[]) {
      try {
        // Check if user already exists
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('wordpressId', wpAuthor.id)
          .single();

        if (existing) {
          console.log(`→ Author already exists: ${wpAuthor.name}`);
          continue;
        }

        const { error } = await supabase
          .from('users')
          .insert({
            id: `user_wp_${wpAuthor.id}`,
            wordpressId: wpAuthor.id,
            email: `${wpAuthor.slug}@success.com`,
            password: DEFAULT_PASSWORD,
            name: wpAuthor.name,
            role: 'AUTHOR',
            bio: wpAuthor.description || null,
            authorPageSlug: wpAuthor.slug,
            avatar: wpAuthor.avatar_urls?.['96'] || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        if (error) {
          console.error(`✗ Author error: ${wpAuthor.name}`, error.message);
        } else {
          totalImported++;
          console.log(`✓ Author: ${wpAuthor.name}`);
        }
      } catch (error: any) {
        console.error(`✗ Failed to import author ${wpAuthor.name}:`, error.message);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  console.log(`\n✓ Imported ${totalImported} authors`);
  return totalImported;
}

async function importMedia() {
  console.log('\n=== IMPORTING MEDIA ===');

  let page = 1;
  let totalImported = 0;

  while (true) {
    const { data: wpMedia, totalPages, totalItems } = await fetchFromWordPress('/media', {
      page,
      per_page: 100,
      _fields: 'id,title,source_url,alt_text,media_type,mime_type,media_details'
    });

    console.log(`Page ${page}/${totalPages} - Total media: ${totalItems}`);

    if (!wpMedia || wpMedia.length === 0) break;

    for (const media of wpMedia as WPMedia[]) {
      try {
        const filename = media.media_details?.file || media.source_url.split('/').pop() || 'unknown';

        const { error } = await supabase
          .from('media')
          .upsert({
            id: `media_wp_${media.id}`,
            wordpressId: media.id,
            filename: filename,
            url: media.source_url,
            mimeType: media.mime_type,
            size: media.media_details?.filesize || null,
            width: media.media_details?.width || null,
            height: media.media_details?.height || null,
            alt: media.alt_text || media.title.rendered,
            caption: media.title.rendered,
            uploadedBy: 'wordpress_import',
            createdAt: new Date().toISOString(),
          }, {
            onConflict: 'wordpressId'
          });

        if (error) {
          console.error(`✗ Media error: ${filename}`, error.message);
        } else {
          totalImported++;
          console.log(`✓ Media ${totalImported}: ${filename}`);
        }
      } catch (error: any) {
        console.error(`✗ Failed to import media:`, error.message);
      }
    }

    if (page >= totalPages) break;
    page++;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✓ Imported ${totalImported} media files`);
  return totalImported;
}

async function getOrCreateDefaultAuthor(): Promise<string> {
  const { data: defaultAuthor } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'wordpress-import@success.com')
    .single();

  if (defaultAuthor) {
    return defaultAuthor.id;
  }

  const { data: newAuthor, error } = await supabase
    .from('users')
    .insert({
      id: 'user_wordpress_import',
      email: 'wordpress-import@success.com',
      password: DEFAULT_PASSWORD,
      name: 'WordPress Import',
      role: 'AUTHOR',
      bio: 'Default author for imported WordPress posts',
      authorPageSlug: 'wordpress-import',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create default author:', error);
    return 'user_wordpress_import';
  }

  console.log(`✓ Created default author`);
  return newAuthor.id;
}

async function importPosts(limit: number = 10000) {
  console.log(`\n=== IMPORTING POSTS (limit: ${limit}) ===`);

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

    console.log(`\nPage ${page}/${totalPages} - Total posts: ${totalItems}`);

    if (!wpPosts || wpPosts.length === 0) break;

    for (const wpPost of wpPosts as WPPost[]) {
      try {
        // Get author
        let authorId: string | null = defaultAuthorId;
        let authorName: string | null = null;

        if (wpPost._embedded?.author?.[0]) {
          const wpAuthor = wpPost._embedded.author[0];
          authorName = wpAuthor.name;

          const { data: author } = await supabase
            .from('users')
            .select('id')
            .eq('wordpressId', wpAuthor.id)
            .single();

          if (author) {
            authorId = author.id;
          }
        }

        // Get featured image
        let featuredImage: string | null = null;
        let featuredImageAlt: string | null = null;

        if (wpPost._embedded?.['wp:featuredmedia']?.[0]) {
          const media = wpPost._embedded['wp:featuredmedia'][0];
          featuredImage = media.source_url;
          featuredImageAlt = media.alt_text || wpPost.title.rendered;
        }

        // Calculate read time
        const wordCount = wpPost.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200);

        // Import post
        const { error } = await supabase
          .from('posts')
          .upsert({
            id: `post_wp_${wpPost.id}`,
            wordpressId: wpPost.id,
            title: wpPost.title.rendered,
            slug: wpPost.slug,
            content: wpPost.content.rendered,
            excerpt: wpPost.excerpt.rendered,
            status: wpPost.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            authorId: authorId,
            authorName: authorName,
            wordpressAuthor: authorName,
            featuredImage: featuredImage,
            featuredImageAlt: featuredImageAlt,
            readTime: readTime,
            publishedAt: wpPost.status === 'publish' ? new Date(wpPost.date).toISOString() : null,
            createdAt: new Date(wpPost.date).toISOString(),
            updatedAt: new Date(wpPost.modified).toISOString(),
          }, {
            onConflict: 'wordpressId'
          });

        if (error) {
          console.error(`✗ Post error: ${wpPost.title.rendered.substring(0, 60)}`, error.message);
        } else {
          totalImported++;
          console.log(`✓ Post ${totalImported}: ${wpPost.title.rendered.substring(0, 60)}...`);
        }

        if (totalImported >= limit) {
          console.log(`\n✓ Reached import limit of ${limit} posts`);
          break;
        }
      } catch (error: any) {
        console.error(`✗ Failed to import post:`, error.message);
      }
    }

    if (page >= totalPages || totalImported >= limit) break;
    page++;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✓ Imported ${totalImported} posts`);
  return totalImported;
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   SUCCESS Magazine - Complete WP Content Scrape║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`WordPress API: ${WORDPRESS_API_URL}`);
  console.log(`Database: ${supabaseUrl}\n`);

  try {
    const stats = {
      categories: 0,
      tags: 0,
      authors: 0,
      media: 0,
      posts: 0
    };

    // Import in order
    stats.categories = await importCategories();
    stats.tags = await importTags();
    stats.authors = await importAuthors();
    stats.media = await importMedia();

    // Import posts (get limit from CLI arg)
    const limit = parseInt(process.argv[2]) || 10000;
    stats.posts = await importPosts(limit);

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              IMPORT COMPLETE! ✓                 ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('Summary:');
    console.log(`  Categories: ${stats.categories}`);
    console.log(`  Tags:       ${stats.tags}`);
    console.log(`  Authors:    ${stats.authors}`);
    console.log(`  Media:      ${stats.media}`);
    console.log(`  Posts:      ${stats.posts}`);
    console.log('');

  } catch (error: any) {
    console.error('\n✗ Import failed:', error.message);
    process.exit(1);
  }
}

main();
