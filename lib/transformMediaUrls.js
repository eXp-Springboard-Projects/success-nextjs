/**
 * Transform WordPress media URLs to point to cloud storage (R2, S3, etc.)
 * This handles URLs in content, featured images, and ACF fields
 */

// Your WordPress domain
const WP_DOMAIN = 'https://successcom.wpenginepowered.com';
const WP_UPLOADS_PATH = '/wp-content/uploads/';

// Your cloud storage public URL
const MEDIA_CDN_URL = process.env.NEXT_PUBLIC_MEDIA_CDN_URL || 'https://media.success.com';

/**
 * Transform a single WordPress media URL to CDN URL
 * @param {string} url - Original WordPress media URL
 * @returns {string} - Transformed CDN URL
 */
export function transformMediaUrl(url) {
  if (!url) return url;

  // Check if this is a WordPress uploads URL
  if (url.includes(WP_UPLOADS_PATH)) {
    // Extract the path after /wp-content/uploads/
    const uploadsIndex = url.indexOf(WP_UPLOADS_PATH);
    const mediaPath = url.substring(uploadsIndex + WP_UPLOADS_PATH.length);

    // Return the new CDN URL
    return `${MEDIA_CDN_URL}/${mediaPath}`;
  }

  return url;
}

/**
 * Transform all media URLs in HTML content
 * This handles images, videos, audio, and other media in post content
 * @param {string} content - HTML content with WordPress URLs
 * @returns {string} - Content with transformed URLs
 */
export function transformContentMediaUrls(content) {
  if (!content) return content;

  // Replace all instances of WordPress uploads URLs
  const wpUploadsRegex = new RegExp(
    `${WP_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${WP_UPLOADS_PATH}`,
    'g'
  );

  return content.replace(wpUploadsRegex, `${MEDIA_CDN_URL}/`);
}

/**
 * Transform media URLs in a WordPress post/page object
 * This handles featuredImage, ACF fields, and content
 * @param {object} post - WordPress post/page object from GraphQL
 * @returns {object} - Post with transformed URLs
 */
export function transformPostMediaUrls(post) {
  if (!post) return post;

  const transformed = { ...post };

  // Transform featured image
  if (transformed.featuredImage?.node?.sourceUrl) {
    transformed.featuredImage.node.sourceUrl = transformMediaUrl(
      transformed.featuredImage.node.sourceUrl
    );
  }

  // Transform content
  if (transformed.content) {
    transformed.content = transformContentMediaUrls(transformed.content);
  }

  // Transform excerpt
  if (transformed.excerpt) {
    transformed.excerpt = transformContentMediaUrls(transformed.excerpt);
  }

  // Transform ACF image fields (common patterns)
  // Add your specific ACF field names here
  if (transformed.magazineFields?.coverImage?.sourceUrl) {
    transformed.magazineFields.coverImage.sourceUrl = transformMediaUrl(
      transformed.magazineFields.coverImage.sourceUrl
    );
  }

  // Transform author avatar
  if (transformed.author?.node?.avatar?.url) {
    transformed.author.node.avatar.url = transformMediaUrl(
      transformed.author.node.avatar.url
    );
  }

  return transformed;
}

/**
 * Transform media URLs in an array of posts
 * @param {array} posts - Array of WordPress posts from GraphQL
 * @returns {array} - Posts with transformed URLs
 */
export function transformPostsMediaUrls(posts) {
  if (!posts || !Array.isArray(posts)) return posts;
  return posts.map(transformPostMediaUrls);
}
