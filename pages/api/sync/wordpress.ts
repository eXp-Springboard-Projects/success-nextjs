import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { randomUUID } from 'crypto';

// WordPress to Prisma sync handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { entity = 'posts', limit = 100, offset = 0, dryRun = false } = req.body;

  try {
    const result = await syncWordPressEntity(entity, limit, offset, dryRun, session.user.id);

    const supabase = supabaseAdmin();

    // Log the sync action
    if (!dryRun) {
      await supabase
        .from('activity_logs')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          action: 'WORDPRESS_SYNC',
          entity: entity.toUpperCase(),
          entityId: null,
          details: JSON.stringify({
            created: result.created,
            updated: result.updated,
            errors: result.errors.length,
            total: result.total,
          }),
          createdAt: new Date().toISOString(),
        });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Sync failed',
      message: error.message,
    });
  }
}

async function syncWordPressEntity(
  entity: string,
  limit: number,
  offset: number,
  dryRun: boolean,
  userId: string
) {
  const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://successcom.wpenginepowered.com/wp-json/wp/v2';

  const result = {
    entity,
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as any[],
    items: [] as any[],
  };

  try {
    switch (entity) {
      case 'posts':
        await syncPosts(WORDPRESS_API_URL, limit, offset, dryRun, userId, result);
        break;
      case 'categories':
        await syncCategories(WORDPRESS_API_URL, limit, offset, dryRun, result);
        break;
      case 'tags':
        await syncTags(WORDPRESS_API_URL, limit, offset, dryRun, result);
        break;
      case 'users':
        await syncUsers(WORDPRESS_API_URL, limit, offset, dryRun, result);
        break;
      default:
        throw new Error(`Unsupported entity: ${entity}`);
    }
  } catch (error: any) {
    result.errors.push({
      entity,
      error: error.message,
    });
  }

  return result;
}

async function syncPosts(
  apiUrl: string,
  limit: number,
  offset: number,
  dryRun: boolean,
  userId: string,
  result: any
) {
  // Fetch posts from WordPress
  const response = await fetch(
    `${apiUrl}/posts?_embed&per_page=${limit}&offset=${offset}&status=publish`,
    {
      headers: { 'User-Agent': 'SUCCESS-Next.js-Sync' },
    }
  );

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  const wpPosts = await response.json();
  result.total = wpPosts.length;

  for (const wpPost of wpPosts) {
    try {
      const postData = await transformWordPressPost(wpPost, userId);

      if (dryRun) {
        result.items.push({
          action: 'would_create_or_update',
          id: wpPost.id,
          title: wpPost.title.rendered,
          slug: wpPost.slug,
        });
        result.skipped++;
        continue;
      }

      const supabase = supabaseAdmin();

      // Check if post already exists by WordPress ID stored in metadata
      const { data: existingPost, error: findError } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', postData.slug)
        .single();

      if (existingPost && !findError) {
        // Update existing post
        await supabase
          .from('posts')
          .update({
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt,
            featuredImage: postData.featuredImage,
            featuredImageAlt: postData.featuredImageAlt,
            publishedAt: postData.publishedAt,
            updatedAt: new Date().toISOString(),
            readTime: postData.readTime,
            seoTitle: postData.seoTitle,
            seoDescription: postData.seoDescription,
          })
          .eq('id', existingPost.id);

        // Sync categories
        if (wpPost._embedded?.['wp:term']?.[0]) {
          await syncPostCategories(existingPost.id, wpPost._embedded['wp:term'][0]);
        }

        // Sync tags
        if (wpPost._embedded?.['wp:term']?.[1]) {
          await syncPostTags(existingPost.id, wpPost._embedded['wp:term'][1]);
        }

        result.updated++;
      } else {
        // Create new post
        const { data: newPost, error: createError } = await supabase
          .from('posts')
          .insert(postData)
          .select()
          .single();

        if (createError) throw createError;

        // Sync categories
        if (wpPost._embedded?.['wp:term']?.[0]) {
          await syncPostCategories(newPost.id, wpPost._embedded['wp:term'][0]);
        }

        // Sync tags
        if (wpPost._embedded?.['wp:term']?.[1]) {
          await syncPostTags(newPost.id, wpPost._embedded['wp:term'][1]);
        }

        result.created++;
      }
    } catch (error: any) {
      result.errors.push({
        id: wpPost.id,
        title: wpPost.title?.rendered || 'Unknown',
        error: error.message,
      });
    }
  }
}

async function transformWordPressPost(wpPost: any, authorId: string) {
  // Extract featured image
  let featuredImage = null;
  let featuredImageAlt = null;
  if (wpPost._embedded?.['wp:featuredmedia']?.[0]) {
    const media = wpPost._embedded['wp:featuredmedia'][0];
    featuredImage = media.source_url;
    featuredImageAlt = media.alt_text || media.title?.rendered || '';
  }

  // Calculate read time (200 words per minute)
  const content = wpPost.content?.rendered || '';
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Extract excerpt
  const excerpt = wpPost.excerpt?.rendered
    ? wpPost.excerpt.rendered.replace(/<[^>]*>/g, '').trim()
    : content.replace(/<[^>]*>/g, '').substring(0, 160) + '...';

  return {
    id: randomUUID(),
    title: wpPost.title?.rendered || 'Untitled',
    slug: wpPost.slug,
    content: content,
    excerpt: excerpt,
    featuredImage,
    featuredImageAlt,
    status: wpPost.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
    authorId: authorId, // Use current admin user as author for now
    publishedAt: wpPost.date ? new Date(wpPost.date) : null,
    createdAt: new Date(wpPost.date || Date.now()),
    updatedAt: new Date(wpPost.modified || Date.now()),
    readTime,
    seoTitle: wpPost.yoast_head_json?.title || wpPost.title?.rendered,
    seoDescription: wpPost.yoast_head_json?.description || excerpt,
    views: 0,
  };
}

async function syncPostCategories(postId: string, wpCategories: any[]) {
  // Note: Supabase doesn't have direct many-to-many relationship management
  // You'll need to use a junction table (e.g., post_categories) to manage this
  // For now, we'll skip the relationship syncing as it requires a different approach
  // This would need to be handled via a post_categories junction table

  for (const wpCat of wpCategories) {
    try {
      const supabase = supabaseAdmin();

      // Find or create category
      const { data: category, error: findError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', wpCat.slug)
        .single();

      let categoryId;

      if (!category || findError) {
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            id: randomUUID(),
            name: wpCat.name,
            slug: wpCat.slug,
            description: wpCat.description || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        categoryId = newCategory.id;
      } else {
        categoryId = category.id;
      }

      // TODO: Insert into post_categories junction table
      // This requires schema changes to support many-to-many relationships
    } catch (error) {
    }
  }
}

async function syncPostTags(postId: string, wpTags: any[]) {
  // Note: Supabase doesn't have direct many-to-many relationship management
  // You'll need to use a junction table (e.g., post_tags) to manage this

  for (const wpTag of wpTags) {
    try {
      const supabase = supabaseAdmin();

      // Find or create tag
      const { data: tag, error: findError } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', wpTag.slug)
        .single();

      let tagId;

      if (!tag || findError) {
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({
            id: randomUUID(),
            name: wpTag.name,
            slug: wpTag.slug,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        tagId = newTag.id;
      } else {
        tagId = tag.id;
      }

      // TODO: Insert into post_tags junction table
      // This requires schema changes to support many-to-many relationships
    } catch (error) {
    }
  }
}

async function syncCategories(
  apiUrl: string,
  limit: number,
  offset: number,
  dryRun: boolean,
  result: any
) {
  const response = await fetch(
    `${apiUrl}/categories?per_page=${limit}&offset=${offset}`,
    {
      headers: { 'User-Agent': 'SUCCESS-Next.js-Sync' },
    }
  );

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  const wpCategories = await response.json();
  result.total = wpCategories.length;

  for (const wpCat of wpCategories) {
    try {
      if (dryRun) {
        result.items.push({
          action: 'would_create_or_update',
          id: wpCat.id,
          name: wpCat.name,
          slug: wpCat.slug,
        });
        result.skipped++;
        continue;
      }

      const supabase = supabaseAdmin();

      const { data: existing, error: findError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', wpCat.slug)
        .single();

      if (existing && !findError) {
        await supabase
          .from('categories')
          .update({
            name: wpCat.name,
            description: wpCat.description || null,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existing.id);
        result.updated++;
      } else {
        await supabase
          .from('categories')
          .insert({
            id: randomUUID(),
            name: wpCat.name,
            slug: wpCat.slug,
            description: wpCat.description || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        result.created++;
      }
    } catch (error: any) {
      result.errors.push({
        id: wpCat.id,
        name: wpCat.name,
        error: error.message,
      });
    }
  }
}

async function syncTags(
  apiUrl: string,
  limit: number,
  offset: number,
  dryRun: boolean,
  result: any
) {
  const response = await fetch(
    `${apiUrl}/tags?per_page=${limit}&offset=${offset}`,
    {
      headers: { 'User-Agent': 'SUCCESS-Next.js-Sync' },
    }
  );

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  const wpTags = await response.json();
  result.total = wpTags.length;

  for (const wpTag of wpTags) {
    try {
      if (dryRun) {
        result.items.push({
          action: 'would_create_or_update',
          id: wpTag.id,
          name: wpTag.name,
          slug: wpTag.slug,
        });
        result.skipped++;
        continue;
      }

      const supabase = supabaseAdmin();

      const { data: existing, error: findError } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', wpTag.slug)
        .single();

      if (existing && !findError) {
        await supabase
          .from('tags')
          .update({
            name: wpTag.name,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existing.id);
        result.updated++;
      } else {
        await supabase
          .from('tags')
          .insert({
            id: randomUUID(),
            name: wpTag.name,
            slug: wpTag.slug,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        result.created++;
      }
    } catch (error: any) {
      result.errors.push({
        id: wpTag.id,
        name: wpTag.name,
        error: error.message,
      });
    }
  }
}

async function syncUsers(
  apiUrl: string,
  limit: number,
  offset: number,
  dryRun: boolean,
  result: any
) {
  const response = await fetch(
    `${apiUrl}/users?per_page=${limit}&offset=${offset}`,
    {
      headers: { 'User-Agent': 'SUCCESS-Next.js-Sync' },
    }
  );

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  const wpUsers = await response.json();
  result.total = wpUsers.length;

  for (const wpUser of wpUsers) {
    try {
      if (dryRun) {
        result.items.push({
          action: 'would_create_or_update',
          id: wpUser.id,
          name: wpUser.name,
          slug: wpUser.slug,
        });
        result.skipped++;
        continue;
      }

      const supabase = supabaseAdmin();

      // Check if user exists by slug (WordPress username)
      const { data: existingUsers, error: findError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${wpUser.slug}@success.com,name.eq.${wpUser.name}`)
        .limit(1);

      const existing = existingUsers?.[0];

      if (existing && !findError) {
        await supabase
          .from('users')
          .update({
            name: wpUser.name,
            bio: wpUser.description || null,
            avatar: wpUser.avatar_urls?.['96'] || null,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existing.id);
        result.updated++;
      } else {
        // Create placeholder user (they won't be able to log in without setting password)
        await supabase
          .from('users')
          .insert({
            id: randomUUID(),
            name: wpUser.name,
            email: wpUser.slug + '@success.com', // Placeholder
            password: '', // No password - can't log in
            role: 'AUTHOR',
            bio: wpUser.description || null,
            avatar: wpUser.avatar_urls?.['96'] || null,
            subscriptionStatus: 'INACTIVE',
            emailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        result.created++;
      }
    } catch (error: any) {
      result.errors.push({
        id: wpUser.id,
        name: wpUser.name,
        error: error.message,
      });
    }
  }
}
