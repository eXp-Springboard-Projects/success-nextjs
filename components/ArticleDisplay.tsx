import { useEffect, useRef } from 'react';
import Link from 'next/link';
import PaywallGate from './PaywallGate';
import styles from './ArticleDisplay.module.css';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  author: {
    name: string;
    bio?: string;
    avatar?: string;
  };
  publishedAt: Date;
  readTime?: number;
  categories: Array<{ name: string; slug: string }>;
  tags: Array<{ name: string; slug: string }>;
}

interface RelatedPost {
  title: string;
  slug: string;
  featuredImage?: string;
  excerpt?: string;
}

interface ArticleDisplayProps {
  article: Article;
  relatedPosts?: RelatedPost[];
  enablePaywall?: boolean;
  enableAds?: boolean;
}

export default function ArticleDisplay({
  article,
  relatedPosts = [],
  enablePaywall = true,
  enableAds = true
}: ArticleDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enableAds && contentRef.current) {
      injectAds();
    }
  }, [enableAds]);

  function injectAds() {
    if (!contentRef.current) return;

    const paragraphs = contentRef.current.querySelectorAll('p');
    let adCount = 0;
    const maxAds = 3;

    paragraphs.forEach((p, index) => {
      // Insert ad every 3 paragraphs
      if (index > 0 && index % 3 === 0 && adCount < maxAds) {
        const adContainer = document.createElement('div');
        adContainer.className = styles.adContainer;
        adContainer.innerHTML = `
          <div class="${styles.adLabel}">Advertisement</div>
          <div id="ad-slot-${adCount}" class="${styles.adSlot}">
            <!-- Google Ad Manager ad will load here -->
            <div style="background: #f3f4f6; padding: 100px 20px; text-align: center; color: #9ca3af;">
              Ad Placeholder ${adCount + 1}
            </div>
          </div>
        `;

        p.after(adContainer);
        adCount++;

        // Load Google Ad Manager ad
        if (typeof window !== 'undefined' && (window as any).googletag) {
          loadGoogleAd(`ad-slot-${adCount - 1}`);
        }
      }
    });
  }

  function loadGoogleAd(slotId: string) {
    // Google Ad Manager integration
    // This is a placeholder - configure with your GAM account
    try {
      const googletag = (window as any).googletag;
      googletag.cmd.push(() => {
        const adSlot = googletag
          .defineSlot('/YOUR_GAM_ACCOUNT_ID/article-inline', [[300, 250], [336, 280]], slotId)
          .addService(googletag.pubads());

        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
        googletag.display(slotId);
      });
    } catch (error) {
    }
  }

  function handleShare(platform: string) {
    const url = `${window.location.origin}/${article.slug}`;
    const text = article.title;

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  }

  const articleContent = (
    <article className={styles.article}>
      {/* Article Header */}
      <header className={styles.header}>
        <div className={styles.meta}>
          <time dateTime={article.publishedAt.toISOString()}>
            {new Date(article.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
          {article.readTime && (
            <>
              <span className={styles.separator}>•</span>
              <span>{article.readTime} min read</span>
            </>
          )}
        </div>

        <h1 className={styles.title}>{article.title}</h1>

        {article.excerpt && (
          <p className={styles.excerpt}>{article.excerpt}</p>
        )}

        {/* Categories */}
        {article.categories.length > 0 && (
          <div className={styles.categories}>
            {article.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={styles.category}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className={styles.featuredImage}>
          <img
            src={article.featuredImage}
            alt={article.featuredImageAlt || article.title}
            className={styles.image}
          />
        </div>
      )}

      {/* Share Buttons */}
      <div className={styles.shareButtons}>
        <span className={styles.shareLabel}>Share:</span>
        <button
          onClick={() => handleShare('twitter')}
          className={styles.shareButton}
          aria-label="Share on Twitter"
        >
          <svg viewBox="0 0 24 24" className={styles.shareIcon}>
            <path fill="currentColor" d="M22.46 6c-.85.38-1.76.63-2.72.75 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17-.88-.93-2.13-1.51-3.51-1.51-2.66 0-4.82 2.16-4.82 4.82 0 .38.04.75.12 1.1-4.01-.2-7.57-2.12-9.95-5.04-.42.72-.66 1.55-.66 2.44 0 1.67.85 3.14 2.14 4-.79-.02-1.53-.24-2.18-.6v.06c0 2.34 1.66 4.29 3.87 4.73-.4.11-.83.17-1.27.17-.31 0-.61-.03-.91-.08.62 1.92 2.4 3.32 4.51 3.36-1.65 1.29-3.73 2.06-5.99 2.06-.39 0-.77-.02-1.15-.07 2.13 1.37 4.66 2.17 7.38 2.17 8.85 0 13.69-7.33 13.69-13.69 0-.21 0-.42-.02-.62.94-.68 1.76-1.53 2.41-2.49z"/>
          </svg>
        </button>
        <button
          onClick={() => handleShare('facebook')}
          className={styles.shareButton}
          aria-label="Share on Facebook"
        >
          <svg viewBox="0 0 24 24" className={styles.shareIcon}>
            <path fill="currentColor" d="M9.03 23V12.95h-3v-3.99h3V6.29c0-2.99 1.83-4.62 4.49-4.62 1.28 0 2.38.09 2.7.14v3.13h-1.85c-1.45 0-1.73.69-1.73 1.7v2.23h3.46l-.45 3.99h-3v10.05z"/>
          </svg>
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className={styles.shareButton}
          aria-label="Share on LinkedIn"
        >
          <svg viewBox="0 0 24 24" className={styles.shareIcon}>
            <path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        </button>
        <button
          onClick={() => handleShare('email')}
          className={styles.shareButton}
          aria-label="Share via Email"
        >
          <svg viewBox="0 0 24 24" className={styles.shareIcon}>
            <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </button>
      </div>

      {/* Article Content */}
      <div
        ref={contentRef}
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className={styles.tags}>
          <span className={styles.tagsLabel}>Tags:</span>
          {article.tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tag/${tag.slug}`}
              className={styles.tag}
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Author Bio */}
      <div className={styles.authorBio}>
        {article.author.avatar && (
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className={styles.authorAvatar}
          />
        )}
        <div className={styles.authorInfo}>
          <h3 className={styles.authorName}>About {article.author.name}</h3>
          {article.author.bio && (
            <p className={styles.authorBioText}>{article.author.bio}</p>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className={styles.relatedPosts}>
          <h2 className={styles.relatedTitle}>You Might Also Like</h2>
          <div className={styles.relatedGrid}>
            {relatedPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/${post.slug}`}
                className={styles.relatedCard}
              >
                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className={styles.relatedImage}
                  />
                )}
                <h3 className={styles.relatedCardTitle}>{post.title}</h3>
                {post.excerpt && (
                  <p className={styles.relatedExcerpt}>{post.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );

  if (enablePaywall) {
    return (
      <PaywallGate
        articleId={article.id}
        articleTitle={article.title}
        articleUrl={`/${article.slug}`}
      >
        {articleContent}
      </PaywallGate>
    );
  }

  return articleContent;
}
