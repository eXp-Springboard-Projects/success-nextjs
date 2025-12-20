import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import Paywall from '../../components/Paywall';
import styles from '../blog/Post.module.css';
import { fetchWordPressData } from '../../lib/wordpress';
import { decodeHtmlEntities, decodeHtmlContent } from '../../lib/htmlDecode';
import { canAccessContent } from '../../lib/access-control';

type PodcastPageProps = {
  podcast: any;
  relatedPodcasts: any[];
  hasAccess: boolean;
};

export default function PodcastPage({ podcast, relatedPodcasts, hasAccess }: PodcastPageProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Share handlers
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = decodeHtmlEntities(podcast?.title?.rendered || '');

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
    }
  };

  if (router.isFallback || !podcast) {
    return <Layout><div className={styles.loading}>Loading...</div></Layout>;
  }

  const category = podcast._embedded?.['wp:term']?.[0]?.[0];
  const author = podcast._embedded?.author?.[0];
  const featuredImage = podcast._embedded?.['wp:featuredmedia']?.[0];

  // Check if this is premium content and user doesn't have access
  const isPremium = podcast.isPremium || podcast.meta?.isPremium || false;
  const requiredTier = (podcast.requiredTier || podcast.meta?.requiredTier || 'collective') as 'collective' | 'insider';

  if (isPremium && !hasAccess) {
    return (
      <Layout>
        <SEO
          title={decodeHtmlEntities(podcast.title.rendered)}
          description={decodeHtmlEntities(podcast.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '')}
          url={`https://www.success.com/podcast/${podcast.slug}`}
          type="article"
          image={featuredImage?.source_url}
        />
        <Paywall
          requiredTier={requiredTier}
          articleTitle={decodeHtmlEntities(podcast.title.rendered)}
          excerpt={decodeHtmlContent(podcast.excerpt?.rendered || '')}
        />
      </Layout>
    );
  }

  // Format date
  const podcastDate = new Date(podcast.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Extract plain text from excerpt for SEO
  const getPlainText = (html: string) => {
    return html?.replace(/<[^>]*>/g, '').trim() || '';
  };

  const seoDescription = podcast.excerpt?.rendered
    ? getPlainText(podcast.excerpt.rendered)
    : getPlainText(podcast.content?.rendered?.substring(0, 300) || '');

  // Structured data for podcast
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: decodeHtmlEntities(podcast.title.rendered),
    description: seoDescription,
    image: featuredImage?.source_url,
    datePublished: podcast.date,
    publisher: {
      '@type': 'Organization',
      name: 'SUCCESS',
      logo: {
        '@type': 'ImageObject',
        url: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/success-logo.png',
      },
    },
  };

  return (
    <Layout>
      <SEO
        title={decodeHtmlEntities(podcast.title.rendered)}
        description={seoDescription}
        image={featuredImage?.source_url}
        url={`https://www.success.com/podcast/${podcast.slug}`}
        type="article"
        publishedTime={podcast.date}
        modifiedTime={podcast.modified}
        author={author?.name ? decodeHtmlEntities(author.name) : undefined}
        keywords={category?.name ? decodeHtmlEntities(category.name) : undefined}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className={styles.article}>
        {/* Podcast Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            {category && (
              <a href={`/category/${category.slug}`} className={styles.category}>
                {decodeHtmlEntities(category.name)}
              </a>
            )}
            <h1 className={styles.title}>{decodeHtmlEntities(podcast.title.rendered)}</h1>

            <div className={styles.meta}>
              {author && (
                <span className={styles.author}>By {decodeHtmlEntities(author.name)}</span>
              )}
              <span className={styles.date}>{podcastDate}</span>
            </div>

            {podcast.excerpt?.rendered && (
              <div
                className={styles.excerpt}
                dangerouslySetInnerHTML={{ __html: decodeHtmlContent(podcast.excerpt.rendered) }}
              />
            )}
          </div>
        </header>

        {/* Featured Image */}
        {featuredImage && (
          <div className={styles.featuredImageWrapper}>
            <img
              src={featuredImage.source_url}
              alt={featuredImage.alt_text || decodeHtmlEntities(podcast.title.rendered)}
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

        {/* Podcast Content */}
        <div className={styles.content}>
          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: decodeHtmlContent(podcast.content.rendered) }}
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

        {/* Share Section */}
        <div className={styles.actionsSection}>
          <div className={styles.shareSection}>
            <h3 className={styles.shareTitle}>Share This Episode</h3>
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

      {/* Related Podcasts */}
      {relatedPodcasts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedContainer}>
            <h2 className={styles.relatedTitle}>Related Episodes</h2>
            <div className={styles.relatedGrid}>
              {relatedPodcasts.map((relatedPodcast) => {
                const relatedImage = relatedPodcast._embedded?.['wp:featuredmedia']?.[0];
                const relatedCategory = relatedPodcast._embedded?.['wp:term']?.[0]?.[0];

                return (
                  <a key={relatedPodcast.id} href={`/podcast/${relatedPodcast.slug}`} className={styles.relatedCard}>
                    {relatedImage && (
                      <img
                        src={relatedImage.source_url}
                        alt={decodeHtmlEntities(relatedPodcast.title.rendered)}
                        className={styles.relatedImage}
                      />
                    )}
                    <div className={styles.relatedContent}>
                      {relatedCategory && (
                        <span className={styles.relatedCategory}>{decodeHtmlEntities(relatedCategory.name)}</span>
                      )}
                      <h3 className={styles.relatedCardTitle}>{decodeHtmlEntities(relatedPodcast.title.rendered)}</h3>
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
    const podcasts = await fetchWordPressData(`podcasts?slug=${slug}&_embed`);
    const podcast = podcasts[0];

    if (!podcast) {
      return { notFound: true };
    }

    // Fetch related podcasts from the same category
    const categoryId = podcast._embedded?.['wp:term']?.[0]?.[0]?.id;
    let relatedPodcasts = [];

    if (categoryId) {
      const related = await fetchWordPressData(
        `podcasts?categories=${categoryId}&_embed&per_page=3&exclude=${podcast.id}`
      );
      relatedPodcasts = related;
    }

    // Check access for premium content
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('../api/auth/[...nextauth]');
    const session = await getServerSession(req, res, authOptions);

    const isPremium = podcast.isPremium || podcast.meta?.isPremium || false;
    const requiredTier = podcast.requiredTier || podcast.meta?.requiredTier || 'collective';

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
        podcast,
        relatedPodcasts,
        hasAccess,
      }
    };
  } catch (error) {
    console.error(`[Podcast] Error fetching podcast "${slug}":`, error);
    return { notFound: true };
  }
}
