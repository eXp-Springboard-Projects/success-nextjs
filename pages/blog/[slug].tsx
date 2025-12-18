import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import Paywall from '../../components/Paywall';
import styles from './Post.module.css';
import { fetchWordPressData } from '../../lib/wordpress';
import { decodeHtmlEntities, decodeHtmlContent } from '../../lib/htmlDecode';
import { canAccessContent } from '../../lib/access-control';

type PostPageProps = {
  post: any;
  relatedPosts: any[];
  hasAccess: boolean;
};

export default function PostPage({ post, relatedPosts, hasAccess }: PostPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Share handlers
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = decodeHtmlEntities(post?.title?.rendered || '');

  // Check if article is bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (!session || !post) return;

      try {
        const res = await fetch('/api/bookmarks');
        if (res.ok) {
          const bookmarks = await res.json();
          const isAlreadyBookmarked = bookmarks.some(
            (b: any) => b.articleId === post.id.toString()
          );
          setIsBookmarked(isAlreadyBookmarked);
        }
      } catch (error) {
        console.error('Error checking bookmark:', error);
      }
    };

    checkBookmark();
  }, [session, post]);

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank', 'width=600,height=400');
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (!post) return;

    setBookmarkLoading(true);

    try {
      if (isBookmarked) {
        // Remove bookmark - need to find the bookmark ID first
        const res = await fetch('/api/bookmarks');
        if (res.ok) {
          const bookmarks = await res.json();
          const bookmark = bookmarks.find(
            (b: any) => b.articleId === post.id.toString()
          );
          if (bookmark) {
            const deleteRes = await fetch(`/api/bookmarks/${bookmark.id}`, {
              method: 'DELETE',
            });
            if (deleteRes.ok) {
              setIsBookmarked(false);
            }
          }
        }
      } else {
        // Add bookmark
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleId: post.id.toString(),
            articleTitle: decodeHtmlEntities(post.title.rendered),
            articleUrl: shareUrl,
            articleImage: featuredImage?.source_url || null,
          }),
        });

        if (res.ok) {
          setIsBookmarked(true);
        } else if (res.status === 409) {
          // Already bookmarked
          setIsBookmarked(true);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (router.isFallback || !post) {
    return <Layout><div className={styles.loading}>Loading...</div></Layout>;
  }

  const category = post._embedded?.['wp:term']?.[0]?.[0];
  const author = post._embedded?.author?.[0];
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];

  // Check if this is premium content and user doesn't have access
  const isPremium = post.isPremium || post.meta?.isPremium || false;
  const requiredTier = (post.requiredTier || post.meta?.requiredTier || 'collective') as 'collective' | 'insider';

  if (isPremium && !hasAccess) {
    return (
      <Layout>
        <SEO
          title={decodeHtmlEntities(post.title.rendered)}
          description={decodeHtmlEntities(post.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '')}
          url={`https://www.success.com/blog/${post.slug}`}
          type="article"
          image={featuredImage?.source_url}
        />
        <Paywall
          requiredTier={requiredTier}
          articleTitle={decodeHtmlEntities(post.title.rendered)}
          excerpt={decodeHtmlContent(post.excerpt?.rendered || '')}
        />
      </Layout>
    );
  }

  // Format date
  const postDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate read time
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  const readTime = post.content?.rendered ? calculateReadTime(post.content.rendered) : '5 min read';

  // Extract plain text from excerpt for SEO
  const getPlainText = (html: string) => {
    return html?.replace(/<[^>]*>/g, '').trim() || '';
  };

  const seoDescription = post.excerpt?.rendered
    ? getPlainText(post.excerpt.rendered)
    : getPlainText(post.content?.rendered?.substring(0, 300) || '');

  // Structured data for article
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: decodeHtmlEntities(post.title.rendered),
    description: seoDescription,
    image: featuredImage?.source_url,
    datePublished: post.date,
    dateModified: post.modified,
    author: {
      '@type': 'Person',
      name: author?.name ? decodeHtmlEntities(author.name) : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SUCCESS',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.success.com/wp-content/uploads/2024/03/success-logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.success.com/blog/${post.slug}`,
    },
  };

  return (
    <Layout>
      <SEO
        title={decodeHtmlEntities(post.title.rendered)}
        description={seoDescription}
        image={featuredImage?.source_url}
        url={`https://www.success.com/blog/${post.slug}`}
        type="article"
        publishedTime={post.date}
        modifiedTime={post.modified}
        author={author?.name ? decodeHtmlEntities(author.name) : undefined}
        keywords={category?.name ? decodeHtmlEntities(category.name) : undefined}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className={styles.article}>
        {/* Article Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            {category && (
              <a href={`/category/${category.slug}`} className={styles.category}>
                {decodeHtmlEntities(category.name)}
              </a>
            )}
            <h1 className={styles.title}>{decodeHtmlEntities(post.title.rendered)}</h1>

            <div className={styles.meta}>
              {author && (
                <span className={styles.author}>By {decodeHtmlEntities(author.name)}</span>
              )}
              <span className={styles.date}>{postDate}</span>
              <span className={styles.readTime}>{readTime}</span>
            </div>

            {post.excerpt?.rendered && (
              <div
                className={styles.excerpt}
                dangerouslySetInnerHTML={{ __html: decodeHtmlContent(post.excerpt.rendered) }}
              />
            )}
          </div>
        </header>

        {/* Featured Image */}
        {featuredImage && (
          <div className={styles.featuredImageWrapper}>
            <img
              src={featuredImage.source_url}
              alt={featuredImage.alt_text || decodeHtmlEntities(post.title.rendered)}
              className={styles.featuredImage}
            />
            {featuredImage.caption?.rendered && (
              <div
                className={styles.imageCaption}
                dangerouslySetInnerHTML={{ __html: decodeHtmlContent(featuredImage.caption.rendered) }}
              />
            )}
          </div>
        )}

        {/* Article Content */}
        <div className={styles.content}>
          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: decodeHtmlContent(post.content.rendered) }}
          />
        </div>

        {/* Author Bio */}
        {author && (
          <div className={styles.authorBio}>
            <a href={`/author/${author.slug}`} className={styles.authorInfo}>
              {author.avatar_urls && (
                <img
                  src={author.avatar_urls['96']}
                  alt={author.name}
                  className={styles.authorAvatar}
                />
              )}
              <div className={styles.authorDetails}>
                <h3 className={styles.authorName}>{decodeHtmlEntities(author.name)}</h3>
                {author.description && (
                  <div
                    className={styles.authorDescription}
                    dangerouslySetInnerHTML={{ __html: decodeHtmlContent(author.description) }}
                  />
                )}
                <span className={styles.viewProfile}>View Profile →</span>
              </div>
            </a>
          </div>
        )}

        {/* Bookmark and Share Section */}
        <div className={styles.actionsSection}>
          {/* Bookmark Button */}
          {session && (
            <div className={styles.bookmarkSection}>
              <button
                onClick={handleBookmarkToggle}
                className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
                disabled={bookmarkLoading}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Save article'}
              >
                <svg width="20" height="20" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>{bookmarkLoading ? 'Saving...' : isBookmarked ? 'Saved' : 'Save Article'}</span>
              </button>
            </div>
          )}

          {/* Share Buttons */}
          <div className={styles.shareSection}>
            <h3 className={styles.shareTitle}>Share This Article</h3>
            <div className={styles.shareButtons}>
            <button onClick={handleFacebookShare} className={styles.shareBtn} aria-label="Share on Facebook" title="Share on Facebook">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </button>
            <button onClick={handleTwitterShare} className={styles.shareBtn} aria-label="Share on Twitter" title="Share on Twitter">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              <span>Twitter</span>
            </button>
            <button onClick={handleLinkedInShare} className={styles.shareBtn} aria-label="Share on LinkedIn" title="Share on LinkedIn">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn</span>
            </button>
            <button onClick={handleCopyLink} className={styles.shareBtn} aria-label="Copy link" title="Copy link">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Link</span>
            </button>
          </div>
        </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedContainer}>
            <h2 className={styles.relatedTitle}>Related Articles</h2>
            <div className={styles.relatedGrid}>
              {relatedPosts.map((relatedPost) => {
                const relatedImage = relatedPost._embedded?.['wp:featuredmedia']?.[0];
                const relatedCategory = relatedPost._embedded?.['wp:term']?.[0]?.[0];

                return (
                  <a key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className={styles.relatedCard}>
                    {relatedImage && (
                      <img
                        src={relatedImage.source_url}
                        alt={decodeHtmlEntities(relatedPost.title.rendered)}
                        className={styles.relatedImage}
                      />
                    )}
                    <div className={styles.relatedContent}>
                      {relatedCategory && (
                        <span className={styles.relatedCategory}>{decodeHtmlEntities(relatedCategory.name)}</span>
                      )}
                      <h3 className={styles.relatedCardTitle}>{decodeHtmlEntities(relatedPost.title.rendered)}</h3>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ params, req, res }: any) {
  const { slug } = params;

  try {
    const posts = await fetchWordPressData(`posts?slug=${slug}&_embed`);
    const post = posts[0];

    if (!post) {
      return { notFound: true };
    }

    // Fetch related posts from the same category
    const categoryId = post._embedded?.['wp:term']?.[0]?.[0]?.id;
    let relatedPosts = [];

    if (categoryId) {
      const related = await fetchWordPressData(
        `posts?categories=${categoryId}&_embed&per_page=3&exclude=${post.id}`
      );
      relatedPosts = related;
    }

    // Check access for premium content
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('../api/auth/[...nextauth]');
    const session = await getServerSession(req, res, authOptions);

    const isPremium = post.isPremium || post.meta?.isPremium || false;
    const requiredTier = post.requiredTier || post.meta?.requiredTier || 'collective';

    let hasAccess = true; // Default to true for free content

    if (isPremium && session?.user && session.user.email) {
      hasAccess = await canAccessContent(
        { id: session.user.id, email: session.user.email, membershipTier: session.user.membershipTier },
        { isPremium: true, requiredTier: requiredTier as 'collective' | 'insider' }
      );
    } else if (isPremium) {
      hasAccess = false; // Not logged in, can't access premium
    }

    return {
      props: {
        post,
        relatedPosts,
        hasAccess,
      }
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return { notFound: true };
  }
}
