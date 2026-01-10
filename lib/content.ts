/**
 * Local Content API
 *
 * This replaces lib/wordpress.js for fetching content from the local database
 * instead of WordPress REST API.
 */

import { supabaseAdmin } from './supabase';

/**
 * Get published posts with filters and pagination
 */
export async function getPublishedPosts(options: {
  categorySlug?: string;
  categoryId?: string;
  authorId?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'publishedAt' | 'views' | 'createdAt' | 'title';
  search?: string;
} = {}) {
  const {
    categorySlug,
    categoryId,
    authorId,
    tag,
    limit = 10,
    offset = 0,
    orderBy = 'publishedAt',
    search
  } = options;

  const supabase = supabaseAdmin();

  let query = supabase
    .from('posts')
    .select(`
      *,
      post_categories!inner (
        categories (*)
      ),
      post_tags (
        tags (*)
      )
    `)
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString());

  // Handle category filtering with junction table
  if (categoryId || categorySlug) {
    if (categoryId) {
      query = query.eq('post_categories.categoryId', categoryId);
    } else if (categorySlug) {
      query = query.eq('post_categories.categories.slug', categorySlug);
    }
  }

  // Handle tag filtering with junction table
  if (tag) {
    query = query.eq('post_tags.tags.slug', tag);
  }

  // Handle author filtering
  if (authorId) {
    query = query.eq('authorId', authorId);
  }

  // Handle search
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }

  // Handle ordering
  const ascending = orderBy === 'title';
  query = query.order(orderBy, { ascending });

  // Handle pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }

  // Transform the data to match Prisma format
  const posts = (data || []).map((post: any) => {
    const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
    const tags = post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [];

    // Remove junction table data and add flattened arrays
    const { post_categories, post_tags, ...postData } = post;

    return {
      ...postData,
      categories,
      tags
    };
  });

  return posts;
}

/**
 * Get total count of published posts (for pagination)
 */
export async function getPublishedPostsCount(options: {
  categorySlug?: string;
  categoryId?: string;
  authorId?: string;
  tag?: string;
  search?: string;
} = {}) {
  const { categorySlug, categoryId, authorId, tag, search } = options;

  const supabase = supabaseAdmin();

  let query = supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString());

  // Handle category filtering
  if (categoryId || categorySlug) {
    const categoryQuery = supabase
      .from('post_categories')
      .select('postId');

    if (categoryId) {
      categoryQuery.eq('categoryId', categoryId);
    } else if (categorySlug) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (categories) {
        categoryQuery.eq('categoryId', categories.id);
      }
    }

    const { data: postIds } = await categoryQuery;
    if (postIds && postIds.length > 0) {
      query = query.in('id', postIds.map((p: any) => p.postId));
    } else {
      return 0;
    }
  }

  // Handle tag filtering
  if (tag) {
    const { data: tags } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tag)
      .single();

    if (tags) {
      const { data: postIds } = await supabase
        .from('post_tags')
        .select('postId')
        .eq('tagId', tags.id);

      if (postIds && postIds.length > 0) {
        query = query.in('id', postIds.map((p: any) => p.postId));
      } else {
        return 0;
      }
    }
  }

  // Handle author filtering
  if (authorId) {
    query = query.eq('authorId', authorId);
  }

  // Handle search
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error counting published posts:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get single post by slug
 */
export async function getPostBySlug(slug: string) {
  const supabase = supabaseAdmin();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_categories (
        categories (*)
      ),
      post_tags (
        tags (*)
      )
    `)
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString())
    .single();

  if (error || !post) {
    return null;
  }

  // Increment view count
  await supabase
    .from('posts')
    .update({ views: (post.views || 0) + 1 })
    .eq('id', post.id);

  // Transform the data to match Prisma format
  const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
  const tags = post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [];

  const { post_categories, post_tags, ...postData } = post;

  return {
    ...postData,
    categories,
    tags
  };
}

/**
 * Get post by ID (for admin/preview)
 */
export async function getPostById(id: string) {
  const supabase = supabaseAdmin();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_categories (
        categories (*)
      ),
      post_tags (
        tags (*)
      ),
      post_revisions (*)
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    return null;
  }

  // Transform the data to match Prisma format
  const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
  const tags = post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [];

  // Sort revisions by createdAt desc and take 10
  const post_revisions = (post.post_revisions || [])
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const { post_categories, post_tags, ...postData } = post;

  return {
    ...postData,
    categories,
    tags,
    post_revisions
  };
}

/**
 * Get related posts based on categories
 */
export async function getRelatedPosts(
  postId: string,
  categoryIds: string[],
  limit = 3
) {
  if (categoryIds.length === 0) {
    return [];
  }

  const supabase = supabaseAdmin();

  // Get post IDs that have any of the given categories
  const { data: postCategories } = await supabase
    .from('post_categories')
    .select('postId')
    .in('categoryId', categoryIds);

  if (!postCategories || postCategories.length === 0) {
    return [];
  }

  const relatedPostIds = postCategories
    .map((pc: any) => pc.postId)
    .filter((id: string) => id !== postId);

  if (relatedPostIds.length === 0) {
    return [];
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_categories (
        categories (*)
      )
    `)
    .in('id', relatedPostIds)
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString())
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error || !posts) {
    return [];
  }

  // Transform the data to match Prisma format
  return posts.map((post: any) => {
    const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
    const { post_categories, ...postData } = post;

    return {
      ...postData,
      categories
    };
  });
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string, includeCount = false) {
  const supabase = supabaseAdmin();

  const { data: category, error } = await supabase
    .from('categories')
    .select(`
      *,
      parent:categories!categories_parentId_fkey (*),
      children:categories!categories_parentId_fkey (*)
    `)
    .eq('slug', slug)
    .single();

  if (error || !category) {
    return null;
  }

  // Get post count if needed
  let postCount = 0;
  if (includeCount) {
    const { data: postCategories } = await supabase
      .from('post_categories')
      .select('postId')
      .eq('categoryId', category.id);

    if (postCategories && postCategories.length > 0) {
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .in('id', postCategories.map((pc: any) => pc.postId))
        .eq('status', 'PUBLISHED')
        .lte('publishedAt', new Date().toISOString());

      postCount = count || 0;
    }
  }

  return {
    ...category,
    count: postCount
  };
}

/**
 * Get all categories
 */
export async function getAllCategories(includeCount = false) {
  const supabase = supabaseAdmin();

  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      parent:categories!categories_parentId_fkey (*)
    `)
    .order('order', { ascending: true })
    .order('name', { ascending: true });

  if (error || !categories) {
    return [];
  }

  if (!includeCount) {
    return categories;
  }

  // Add post counts
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category: any) => {
      const { data: postCategories } = await supabase
        .from('post_categories')
        .select('postId')
        .eq('categoryId', category.id);

      let count = 0;
      if (postCategories && postCategories.length > 0) {
        const { count: postCount } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .in('id', postCategories.map((pc: any) => pc.postId))
          .eq('status', 'PUBLISHED')
          .lte('publishedAt', new Date().toISOString());

        count = postCount || 0;
      }

      return { ...category, count };
    })
  );

  return categoriesWithCounts;
}

/**
 * Get author/user by slug
 */
export async function getAuthorBySlug(slug: string) {
  const supabase = supabaseAdmin();

  // Try to find by authorPageSlug first
  let { data: author, error } = await supabase
    .from('users')
    .select('*')
    .eq('authorPageSlug', slug)
    .single();

  // Fallback: try to match email username
  if (error || !author) {
    const { data: authorByEmail } = await supabase
      .from('users')
      .select('*')
      .ilike('email', `${slug}%`)
      .single();

    author = authorByEmail;
  }

  if (!author) {
    return null;
  }

  // Fetch author's published posts separately
  const { data: authorPosts } = await supabase
    .from('posts')
    .select(`
      *,
      post_categories (
        categories (*)
      )
    `)
    .eq('authorId', author.id)
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString())
    .order('publishedAt', { ascending: false })
    .limit(50);

  // Transform posts
  const posts = (authorPosts || []).map((post: any) => {
    const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
    const { post_categories, ...postData } = post;
    return {
      ...postData,
      categories
    };
  });

  return {
    ...author,
    posts
  };
}

/**
 * Get all authors who have published posts
 */
export async function getAllAuthors() {
  const supabase = supabaseAdmin();

  // Get all published posts with authors
  const { data: posts } = await supabase
    .from('posts')
    .select('authorId')
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString());

  if (!posts || posts.length === 0) {
    return [];
  }

  // Get unique author IDs
  const authorIds = [...new Set(posts.map((p: any) => p.authorId))];

  // Get authors
  const { data: authors, error } = await supabase
    .from('users')
    .select('*')
    .in('id', authorIds)
    .order('name', { ascending: true });

  if (error || !authors) {
    return [];
  }

  // Add post count for each author
  const authorsWithCount = authors.map((author: any) => {
    const postCount = posts.filter((p: any) => p.authorId === author.id).length;

    return {
      ...author,
      _count: {
        posts: postCount
      }
    };
  });

  return authorsWithCount;
}

/**
 * Get page by slug
 */
export async function getPageBySlug(slug: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single();

  return error ? null : data;
}

/**
 * Get all published pages
 */
export async function getAllPages() {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('status', 'PUBLISHED')
    .order('order', { ascending: true });

  return error ? [] : data;
}

/**
 * Get all magazines
 */
export async function getAllMagazines(limit?: number) {
  const supabase = supabaseAdmin();

  let query = supabase
    .from('magazines')
    .select('*')
    .order('createdAt', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  return error ? [] : data;
}

/**
 * Get magazine by slug
 */
export async function getMagazineBySlug(slug: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('magazines')
    .select('*')
    .eq('slug', slug)
    .single();

  return error ? null : data;
}

/**
 * Get latest magazine
 */
export async function getLatestMagazine() {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('magazines')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(1)
    .single();

  return error ? null : data;
}

/**
 * Get all press releases
 */
export async function getAllPressReleases(limit = 50) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('press_releases')
    .select('*')
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString())
    .order('publishedAt', { ascending: false })
    .limit(limit);

  return error ? [] : data;
}

/**
 * Get press release by slug
 */
export async function getPressReleaseBySlug(slug: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('press_releases')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString())
    .single();

  return error ? null : data;
}

/**
 * Get all tags
 */
export async function getAllTags() {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  return error ? [] : data;
}

/**
 * Get tag by slug with posts
 */
export async function getTagBySlug(slug: string, limit = 20) {
  const supabase = supabaseAdmin();

  const { data: tag, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !tag) {
    return null;
  }

  // Get posts for this tag
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('postId')
    .eq('tagId', tag.id);

  if (!postTags || postTags.length === 0) {
    return {
      ...tag,
      posts: []
    };
  }

  const postIds = postTags.map((pt: any) => pt.postId);

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      post_categories (
        categories (*)
      )
    `)
    .in('id', postIds)
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString())
    .order('publishedAt', { ascending: false })
    .limit(limit);

  // Transform posts
  const transformedPosts = (posts || []).map((post: any) => {
    const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
    const { post_categories, ...postData } = post;

    return {
      ...postData,
      categories
    };
  });

  return {
    ...tag,
    posts: transformedPosts
  };
}

/**
 * Search content across posts, pages, and press releases
 */
export async function searchContent(query: string, limit = 20) {
  const supabase = supabaseAdmin();

  const [postsResult, pagesResult, pressReleasesResult] = await Promise.all([
    supabase
      .from('posts')
      .select(`
        *,
        post_categories (
          categories (*)
        )
      `)
      .eq('status', 'PUBLISHED')
      .lte('publishedAt', new Date().toISOString())
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order('publishedAt', { ascending: false })
      .limit(limit),

    supabase
      .from('pages')
      .select('*')
      .eq('status', 'PUBLISHED')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5),

    supabase
      .from('press_releases')
      .select('*')
      .eq('status', 'PUBLISHED')
      .lte('publishedAt', new Date().toISOString())
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5)
  ]);

  // Transform posts
  const posts = (postsResult.data || []).map((post: any) => {
    const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
    const { post_categories, ...postData } = post;

    return {
      ...postData,
      categories
    };
  });

  const pages = pagesResult.data || [];
  const pressReleases = pressReleasesResult.data || [];

  return {
    posts,
    pages,
    pressReleases,
    total: posts.length + pages.length + pressReleases.length
  };
}

/**
 * Get trending/popular posts by view count
 */
export async function getTrendingPosts(limit = 10, days = 30) {
  const supabase = supabaseAdmin();

  // Calculate date threshold
  const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_categories (
        categories (*)
      )
    `)
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString())
    .gte('publishedAt', dateThreshold)
    .order('views', { ascending: false })
    .limit(limit);

  if (error || !posts) {
    return [];
  }

  // Transform posts
  return posts.map((post: any) => {
    const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
    const { post_categories, ...postData } = post;

    return {
      ...postData,
      categories
    };
  });
}

/**
 * Get posts for sitemap
 */
export async function getAllPostsForSitemap() {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('posts')
    .select('slug, updatedAt, publishedAt')
    .eq('status', 'PUBLISHED')
    .lte('publishedAt', new Date().toISOString())
    .order('publishedAt', { ascending: false });

  return error ? [] : data;
}

/**
 * Get categories for sitemap
 */
export async function getAllCategoriesForSitemap() {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('categories')
    .select('slug, updatedAt')
    .order('name', { ascending: true });

  return error ? [] : data;
}
