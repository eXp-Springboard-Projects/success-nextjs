import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
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

    // Log the sync action
    if (!dryRun) {
      await prisma.activity_logs.create({
        data: {
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
          createdAt: new Date(),
        },
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
  const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://www.success.com/wp-json/wp/v2';

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

      // Check if post already exists by WordPress ID stored in metadata
      const existingPost = await prisma.posts.findFirst({
        where: {
          slug: postData.slug,
        },
      });

      if (existingPost) {
        // Update existing post
        await prisma.posts.update({
          where: { id: existingPost.id },
          data: {
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt,
            featuredImage: postData.featuredImage,
            featuredImageAlt: postData.featuredImageAlt,
            publishedAt: postData.publishedAt,
            updatedAt: new Date(),
            readTime: postData.readTime,
            seoTitle: postData.seoTitle,
            seoDescription: postData.seoDescription,
          },
        });

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
        const newPost = await prisma.posts.create({
          data: postData,
        });

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
  // First, disconnect all existing categories
  await prisma.posts.update({
    where: { id: postId },
    data: {
      categories: {
        set: [],
      },
    },
  });

  // Then connect the new categories
  for (const wpCat of wpCategories) {
    try {
      // Find or create category
      let category = await prisma.categories.findUnique({
        where: { slug: wpCat.slug },
      });

      if (!category) {
        category = await prisma.categories.create({
          data: {
            id: randomUUID(),
            name: wpCat.name,
            slug: wpCat.slug,
            description: wpCat.description || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Connect category to post
      await prisma.posts.update({
        where: { id: postId },
        data: {
          categories: {
            connect: { id: category.id },
          },
        },
      });
    } catch (error) {
    }
  }
}

async function syncPostTags(postId: string, wpTags: any[]) {
  // First, disconnect all existing tags
  await prisma.posts.update({
    where: { id: postId },
    data: {
      tags: {
        set: [],
      },
    },
  });

  // Then connect the new tags
  for (const wpTag of wpTags) {
    try {
      // Find or create tag
      let tag = await prisma.tags.findUnique({
        where: { slug: wpTag.slug },
      });

      if (!tag) {
        tag = await prisma.tags.create({
          data: {
            id: randomUUID(),
            name: wpTag.name,
            slug: wpTag.slug,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Connect tag to post
      await prisma.posts.update({
        where: { id: postId },
        data: {
          tags: {
            connect: { id: tag.id },
          },
        },
      });
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

      const existing = await prisma.categories.findUnique({
        where: { slug: wpCat.slug },
      });

      if (existing) {
        await prisma.categories.update({
          where: { id: existing.id },
          data: {
            name: wpCat.name,
            description: wpCat.description || null,
            updatedAt: new Date(),
          },
        });
        result.updated++;
      } else {
        await prisma.categories.create({
          data: {
            id: randomUUID(),
            name: wpCat.name,
            slug: wpCat.slug,
            description: wpCat.description || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
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

      const existing = await prisma.tags.findUnique({
        where: { slug: wpTag.slug },
      });

      if (existing) {
        await prisma.tags.update({
          where: { id: existing.id },
          data: {
            name: wpTag.name,
            updatedAt: new Date(),
          },
        });
        result.updated++;
      } else {
        await prisma.tags.create({
          data: {
            id: randomUUID(),
            name: wpTag.name,
            slug: wpTag.slug,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
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

      // Check if user exists by slug (WordPress username)
      const existing = await prisma.users.findFirst({
        where: {
          OR: [
            { email: wpUser.slug + '@success.com' }, // Placeholder email
            { name: wpUser.name },
          ],
        },
      });

      if (existing) {
        await prisma.users.update({
          where: { id: existing.id },
          data: {
            name: wpUser.name,
            bio: wpUser.description || null,
            avatar: wpUser.avatar_urls?.['96'] || null,
            updatedAt: new Date(),
          },
        });
        result.updated++;
      } else {
        // Create placeholder user (they won't be able to log in without setting password)
        await prisma.users.create({
          data: {
            id: randomUUID(),
            name: wpUser.name,
            email: wpUser.slug + '@success.com', // Placeholder
            password: '', // No password - can't log in
            role: 'AUTHOR',
            bio: wpUser.description || null,
            avatar: wpUser.avatar_urls?.['96'] || null,
            subscriptionStatus: 'INACTIVE',
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
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
