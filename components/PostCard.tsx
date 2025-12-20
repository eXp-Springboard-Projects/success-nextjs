import Link from 'next/link';
import styles from './PostCard.module.css';
import { decodeHtmlEntities } from '../lib/htmlDecode';

// Helper function to strip HTML and truncate text
function stripHtmlAndTruncate(html: string, maxLength: number): string {
  // Strip HTML tags first
  let text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  // Decode all HTML entities including numeric ones
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// 1. Define the types for the component's props
type PostCardProps = {
  post: any;
  isFeatured?: boolean; // The '?' makes it an optional prop
};

// 2. Apply the type to the function's props
export default function PostCard({ post, isFeatured = false }: PostCardProps) {
  if (!post) return null;

  const category = decodeHtmlEntities(post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Uncategorized');
  const featuredImageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
  const author = decodeHtmlEntities(post._embedded?.author?.[0]?.name || 'SUCCESS Staff');
  const title = decodeHtmlEntities(post.title?.rendered || post.title || 'Untitled');

  // Limit excerpt length for non-featured articles (secondary articles on the right)
  let excerpt = post.excerpt?.rendered || post.content?.rendered?.substring(0, 150) || '';
  if (!isFeatured && excerpt) {
    excerpt = stripHtmlAndTruncate(excerpt, 80);
  }

  const slug = post.slug || '';

  const cardClassName = isFeatured ? `${styles.card} ${styles.featured}` : styles.card;

  if (isFeatured) {
    return (
      <div className={cardClassName}>
        <div className={styles.featuredImageContainer}>
          {featuredImageUrl && (
            <Link href={`/blog/${slug}`}>
              <img src={featuredImageUrl} alt={title} className={styles.image} />
            </Link>
          )}
          <div className={styles.featuredOverlay}>
            <div className={styles.content}>
              <p className={styles.category}>{category}</p>
              <Link href={`/blog/${slug}`} className={styles.titleLink}>
                <h2 className={styles.title}>{title}</h2>
              </Link>
              <p className={styles.author}>By {author}</p>
              {excerpt && (
                <div
                  className={styles.excerpt}
                  dangerouslySetInnerHTML={{ __html: excerpt }}
                />
              )}
              <Link href={`/blog/${slug}`} className={styles.readMore}>
                Read More
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClassName}>
      {featuredImageUrl && (
        <Link href={`/blog/${slug}`}>
          <img src={featuredImageUrl} alt={title} className={styles.image} />
        </Link>
      )}
      <div className={styles.content}>
        <p className={styles.category}>{category}</p>
        <Link href={`/blog/${slug}`} className={styles.titleLink}>
          <h2 className={styles.title}>{title}</h2>
        </Link>
      </div>
    </div>
  );
}