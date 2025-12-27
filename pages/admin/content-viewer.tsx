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

type ContentType = 'all' | 'posts' | 'pages' | 'videos' | 'podcasts';

export default function ContentViewer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentType>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const endpoints = ['posts', 'pages', 'videos', 'podcasts'];

      const promises = endpoints.map(async endpoint => {
        try {
          const perPage = 100;
          const url = `/api/admin/${endpoint}?per_page=${perPage}`;
          console.log(`Fetching ${endpoint} from ${url}`);

          const res = await fetch(url);

          if (!res.ok) {
            console.error(`Failed to fetch ${endpoint}: ${res.status} ${res.statusText}`);
            return { endpoint, data: [], error: `${res.status} ${res.statusText}` };
          }

          const allData = await res.json();
          console.log(`✓ Fetched ${allData.length} items from ${endpoint}`);

          const mappedData = allData.map((item: any) => {
            // Handle title field - WordPress returns { rendered: "..." }, Supabase returns string
            const titleText = typeof item.title === 'string'
              ? item.title
              : item.title?.rendered || 'Untitled';

            return {
              ...item,
              type: item.type || endpoint,
              title: { rendered: titleText },
              date: item.date || item.publishedAt || item.createdAt || item.published_at || new Date().toISOString(),
              link: item.link || (endpoint === 'posts' ? `/blog/${item.slug}` : `/${endpoint.slice(0, -1)}/${item.slug}`),
            };
          });

          console.log(`✓ Total ${endpoint} fetched: ${mappedData.length}`);
          return { endpoint, data: mappedData, error: null };
        } catch (err) {
          console.error(`Exception fetching ${endpoint}:`, err);
          return { endpoint, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(promises);

      // Log errors for any failed endpoints
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.warn('Some endpoints failed:', errors);
      }

      // Flatten successful results
      const allContent = results
        .flatMap(r => r.data)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log(`✓ Total content items loaded: ${allContent.length}`);
      console.log('Content breakdown:', {
        posts: allContent.filter(c => c.type === 'posts').length,
        pages: allContent.filter(c => c.type === 'pages').length,
        videos: allContent.filter(c => c.type === 'videos').length,
        podcasts: allContent.filter(c => c.type === 'podcasts').length,
      });

      setContent(allContent);
    } catch (error) {
      console.error('Error in fetchContent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      return;
    }

    setDeleting(String(id));
    try {
      const res = await fetch(`/api/admin/${type}/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete');
      }

      // Remove from local state
      setContent(prev => prev.filter(item => String(item.id) !== String(id)));
    } catch (error) {
      alert('Failed to delete item. Please try again.');
      console.error('Delete error:', error);
    } finally {
      setDeleting(null);
    }
  };

  const filteredContent = activeTab === 'all'
    ? content
    : content.filter(item => item.type === activeTab);

  const contentCounts = {
    all: content.length,
    posts: content.filter(c => c.type === 'posts').length,
    pages: content.filter(c => c.type === 'pages').length,
    videos: content.filter(c => c.type === 'videos').length,
    podcasts: content.filter(c => c.type === 'podcasts').length,
  };

  const getAddNewUrl = () => {
    if (activeTab === 'all') return '/admin/posts/new';
    return `/admin/${activeTab}/new`;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Live Site Content</h1>
            <p className={styles.subtitle}>Posts, Pages, Videos, and Podcasts from success.com</p>
          </div>
          <a href={getAddNewUrl()} className={styles.addButton}>
            + Add New {activeTab === 'all' ? 'Post' : activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
          </a>
        </div>

        <div className={styles.tabs}>
          <button
            className={activeTab === 'all' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('all')}
          >
            All Content ({contentCounts.all})
          </button>
          <button
            className={activeTab === 'posts' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('posts')}
          >
            Posts ({contentCounts.posts})
          </button>
          <button
            className={activeTab === 'pages' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('pages')}
          >
            Pages ({contentCounts.pages})
          </button>
          <button
            className={activeTab === 'videos' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('videos')}
          >
            Videos ({contentCounts.videos})
          </button>
          <button
            className={activeTab === 'podcasts' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('podcasts')}
          >
            Podcasts ({contentCounts.podcasts})
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading content...</div>
        ) : filteredContent.length === 0 ? (
          <div className={styles.empty}>
            <p>No {activeTab === 'all' ? 'content' : activeTab} found.</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              This viewer displays posts and pages from WordPress.
              <br />
              Check the browser console for detailed API response information.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredContent.map((item) => {
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
                            onClick={() => window.location.href = `/admin/${item.type}/${item.id}/edit`}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDelete(item.id, item.type)}
                            disabled={deleting === String(item.id)}
                          >
                            {deleting === String(item.id) ? 'Deleting...' : 'Delete'}
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
