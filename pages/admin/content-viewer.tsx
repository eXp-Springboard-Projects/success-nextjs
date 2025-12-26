import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './ContentViewer.module.css';
import { decodeHtmlEntities } from '../../lib/htmlDecode';
import { requireAdminAuth } from '@/lib/adminAuth';

interface ContentItem {
  id: number;
  title: { rendered: string };
  link: string;
  date: string;
  status: string;
  type: string;
  source?: 'wordpress' | 'local';
  editable?: boolean;
  _embedded?: any;
}

export default function ContentViewer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'posts' | 'pages' | 'videos' | 'podcasts'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchContent();
  }, [filter]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const endpoints = filter === 'all'
        ? ['posts', 'pages', 'videos', 'podcasts']
        : [filter];

      const promises = endpoints.map(async endpoint => {
        try {
          const res = await fetch(`/api/${endpoint}?per_page=20&status=all&_embed=true`);
          if (!res.ok) {
            console.warn(`Failed to fetch ${endpoint}: ${res.status} ${res.statusText}`);
            return [];
          }
          const data = await res.json();
          console.log(`Fetched ${data.length} items from ${endpoint}`);
          return data.map((item: any) => ({
            ...item,
            type: item.type || endpoint,
            title: { rendered: item.title?.rendered || item.title },
            date: item.date || item.publishedAt || item.createdAt || item.published_at || new Date().toISOString(),
            link: item.link || (endpoint === 'posts' ? `/blog/${item.slug}` : `/${endpoint.slice(0, -1)}/${item.slug}`),
          }));
        } catch (err) {
          console.error(`Error fetching ${endpoint}:`, err);
          return [];
        }
      });

      const results = await Promise.all(promises);
      const allContent = results.flat().sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log(`Total content items: ${allContent.length}`);
      setContent(allContent);
    } catch (error) {
      console.error('Error in fetchContent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1>Live Site Content</h1>
            <button
              onClick={fetchContent}
              className={styles.syncButton}
              disabled={loading}
            >
              {loading ? '⟳ Syncing...' : '⟳ Sync from WordPress'}
            </button>
          </div>
          <div className={styles.filters}>
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? styles.filterActive : styles.filter}
            >
              All Content
            </button>
            <button
              onClick={() => setFilter('posts')}
              className={filter === 'posts' ? styles.filterActive : styles.filter}
            >
              Posts
            </button>
            <button
              onClick={() => setFilter('pages')}
              className={filter === 'pages' ? styles.filterActive : styles.filter}
            >
              Pages
            </button>
            <button
              onClick={() => setFilter('videos')}
              className={filter === 'videos' ? styles.filterActive : styles.filter}
            >
              Videos
            </button>
            <button
              onClick={() => setFilter('podcasts')}
              className={filter === 'podcasts' ? styles.filterActive : styles.filter}
            >
              Podcasts
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading content...</div>
        ) : content.length === 0 ? (
          <div className={styles.empty}>
            <p>No content found. This viewer displays posts, pages, videos, and podcasts from your database.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {content.map((item) => {
              const imageUrl = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;

              return (
                <div key={`${item.type}-${item.id}`} className={styles.card}>
                  {imageUrl && (
                    <div className={styles.cardImage}>
                      <img src={imageUrl} alt={item.title.rendered} />
                    </div>
                  )}
                  <div className={styles.cardContent}>
                    <div className={styles.badges}>
                      <span className={`${styles.badge} ${styles[`badge-${item.type}`]}`}>
                        {item.type}
                      </span>
                      <span className={`${styles.badge} ${styles[`badge-source-${item.source || 'wordpress'}`]}`}>
                        {item.source === 'local' ? '🏠 Local' : '🔗 WordPress'}
                      </span>
                    </div>
                    <h3 className={styles.cardTitle}>
                      {decodeHtmlEntities(item.title.rendered)}
                    </h3>
                    <p className={styles.cardDate}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className={styles.cardActions}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewButton}
                      >
                        View Live
                      </a>
                      {item.editable && (
                        <>
                          <button
                            className={styles.editButton}
                            onClick={() => window.location.href = `/admin/posts/edit/${item.id}`}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this item?')) {
                                // TODO: Implement delete
                                alert('Delete functionality coming soon');
                              }
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      <span className={`${styles.status} ${styles[`status-${item.status}`]}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
