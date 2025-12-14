import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  publishedAt: string;
  readTime: number | null;
  isPremium: boolean;
  isInsiderOnly: boolean;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    color: string | null;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  isBookmarked: boolean;
}

interface PremiumContentResponse {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function PremiumContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState<PremiumContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loadingMore, setLoadingMore] = useState(false);

  const categories = [
    { slug: 'all', name: 'All Categories' },
    { slug: 'ai-technology', name: 'AI & Technology' },
    { slug: 'business-branding', name: 'Business & Branding' },
    { slug: 'entrepreneurship', name: 'Entrepreneurship' },
    { slug: 'leadership', name: 'Leadership' },
    { slug: 'money', name: 'Money & Finance' },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/premium');
    } else if (status === 'authenticated') {
      fetchPremiumContent();
    }
  }, [status, categoryFilter]);

  const fetchPremiumContent = async (loadMore = false) => {
    try {
      const offset = loadMore && content ? content.posts.length : 0;
      const response = await fetch(
        `/api/dashboard/premium-content?category=${categoryFilter}&limit=12&offset=${offset}`
      );

      if (response.status === 403) {
        router.push('/subscribe?error=subscription_required');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch premium content');
      }

      const data: PremiumContentResponse = await response.json();

      if (loadMore && content) {
        setContent({
          ...data,
          posts: [...content.posts, ...data.posts],
        });
      } else {
        setContent(data);
      }
    } catch (error) {
      console.error('Error fetching premium content:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchPremiumContent(true);
  };

  const formatReadTime = (minutes: number | null) => {
    if (!minutes) return '5 min read';
    return `${minutes} min read`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Premium Content Library - SUCCESS+</title>
        <meta name="description" content="Access exclusive SUCCESS+ articles, insights, and content" />
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Link href="/dashboard">
              <img src="/success-logo.png" alt="SUCCESS" />
            </Link>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button><span className={styles.icon}>📊</span> Dashboard</button>
            </Link>
            <Link href="/dashboard/premium">
              <button className={styles.active}><span className={styles.icon}>⭐</span> Premium Content</button>
            </Link>
            <Link href="/dashboard/courses">
              <button><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resources</button>
            </Link>
            <Link href="/dashboard/labs">
              <button><span className={styles.icon}>🔬</span> Success Labs</button>
            </Link>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events</button>
            </Link>
            <Link href="/dashboard/videos">
              <button><span className={styles.icon}>🎥</span> Videos</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcasts</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazines</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <div>
              <h1>Premium Content Library</h1>
              <p className={styles.subtitle}>
                Exclusive articles and insights for SUCCESS+ members
              </p>
            </div>
            <div className={styles.headerBadge}>
              <span className={styles.premiumBadge}>⭐ SUCCESS+ Exclusive</span>
            </div>
          </div>

          {/* Category Filter */}
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <label>Filter by category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.filterSelect}
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {content && (
              <div className={styles.resultCount}>
                {content.total} {content.total === 1 ? 'article' : 'articles'}
              </div>
            )}
          </div>

          {/* Content Grid */}
          {content && content.posts.length > 0 ? (
            <>
              <div className={styles.premiumGrid}>
                {content.posts.map((post) => (
                  <article key={post.id} className={styles.premiumCard}>
                    <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
                      <div className={styles.cardImage}>
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.featuredImageAlt || post.title}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect width="400" height="250" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className={styles.placeholderImage}>
                            <span>📰</span>
                          </div>
                        )}
                        <div className={styles.exclusiveBadge}>
                          {post.isInsiderOnly ? '🌟 Insider' : '⭐ Premium'}
                        </div>
                      </div>
                      <div className={styles.cardContent}>
                        {post.categories.length > 0 && (
                          <div className={styles.cardCategories}>
                            {post.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat.id}
                                className={styles.categoryTag}
                                style={{
                                  background: cat.color || '#f7931e',
                                  color: 'white',
                                }}
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className={styles.cardTitle}>{post.title}</h3>
                        <p className={styles.cardExcerpt}>{post.excerpt}</p>
                        <div className={styles.cardMeta}>
                          <span className={styles.metaDate}>{formatDate(post.publishedAt)}</span>
                          <span className={styles.metaDivider}>•</span>
                          <span className={styles.metaReadTime}>{formatReadTime(post.readTime)}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {content.hasMore && (
                <div className={styles.loadMoreContainer}>
                  <button
                    onClick={handleLoadMore}
                    className={styles.loadMoreBtn}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Articles'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📰</div>
              <h3>No premium content found</h3>
              <p>
                {categoryFilter !== 'all'
                  ? 'Try selecting a different category or view all content.'
                  : 'Check back soon for exclusive SUCCESS+ articles and insights.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
