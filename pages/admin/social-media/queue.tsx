/**
 * Social Media Queue & History
 * View scheduled posts, posting history, and calendar view
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './Queue.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface SocialPost {
  id: string;
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
  platforms: string[];
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  createdAt: string;
  results?: {
    platform: string;
    success: boolean;
    errorMessage: string | null;
    platformPostUrl: string | null;
  }[];
}

const STATUS_COLORS = {
  DRAFT: { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
  SCHEDULED: { bg: '#dbeafe', color: '#1e40af', label: 'Scheduled' },
  POSTING: { bg: '#fef3c7', color: '#92400e', label: 'Posting...' },
  POSTED: { bg: '#d1fae5', color: '#065f46', label: 'Posted' },
  FAILED: { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
};

export default function SocialMediaQueue() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      fetchPosts();
    }
  }, [status, router]);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/social-media/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/social-media/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete post');
      }

      fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete post');
    }
  };

  const handleEdit = (postId: string) => {
    router.push(`/admin/social-media/scheduler?edit=${postId}`);
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.status === filter.toUpperCase();
  });

  const groupedPosts = {
    scheduled: filteredPosts.filter(p => p.status === 'SCHEDULED'),
    posted: filteredPosts.filter(p => p.status === 'POSTED'),
    failed: filteredPosts.filter(p => p.status === 'FAILED'),
    draft: filteredPosts.filter(p => p.status === 'DRAFT'),
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>📋 Social Media Queue</h1>
            <p className={styles.subtitle}>
              View and manage scheduled posts and posting history
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => router.push('/admin/social-media')}
              className={styles.secondaryButton}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => router.push('/admin/social-media/scheduler')}
              className={styles.primaryButton}
            >
              + New Post
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
            <button onClick={() => setError('')} className={styles.closeButton}>×</button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          <button
            onClick={() => setFilter('all')}
            className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
          >
            All Posts ({posts.length})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`${styles.filterTab} ${filter === 'scheduled' ? styles.active : ''}`}
          >
            Scheduled ({groupedPosts.scheduled.length})
          </button>
          <button
            onClick={() => setFilter('posted')}
            className={`${styles.filterTab} ${filter === 'posted' ? styles.active : ''}`}
          >
            Posted ({groupedPosts.posted.length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`${styles.filterTab} ${filter === 'failed' ? styles.active : ''}`}
          >
            Failed ({groupedPosts.failed.length})
          </button>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No posts found</h3>
            <p>Start scheduling posts to see them here</p>
            <button
              onClick={() => router.push('/admin/social-media/scheduler')}
              className={styles.primaryButton}
            >
              Schedule Your First Post
            </button>
          </div>
        ) : (
          <div className={styles.postsGrid}>
            {filteredPosts.map((post) => {
              const statusInfo = STATUS_COLORS[post.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.DRAFT;

              return (
                <div key={post.id} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <div
                      className={styles.postStatus}
                      style={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color,
                      }}
                    >
                      {statusInfo.label}
                    </div>
                    <div className={styles.postActions}>
                      {post.status === 'DRAFT' || post.status === 'SCHEDULED' ? (
                        <button
                          onClick={() => handleEdit(post.id)}
                          className={styles.editButton}
                          title="Edit post"
                        >
                          ✏️
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className={styles.deleteButton}
                        title="Delete post"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className={styles.postContent}>
                    <p>{post.content}</p>
                    {post.imageUrl && (
                      <div className={styles.postImage}>
                        <img src={post.imageUrl} alt="Post image" />
                      </div>
                    )}
                    {post.linkUrl && (
                      <div className={styles.postLink}>
                        🔗 {post.linkUrl}
                      </div>
                    )}
                  </div>

                  <div className={styles.postPlatforms}>
                    {post.platforms.map((platform) => (
                      <span key={platform} className={styles.platformBadge}>
                        {platform}
                      </span>
                    ))}
                  </div>

                  <div className={styles.postFooter}>
                    {post.scheduledAt && post.status === 'SCHEDULED' && (
                      <div className={styles.postTime}>
                        📅 {new Date(post.scheduledAt).toLocaleString()}
                      </div>
                    )}
                    {post.postedAt && (
                      <div className={styles.postTime}>
                        ✅ Posted {new Date(post.postedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Results */}
                  {post.results && post.results.length > 0 && (
                    <div className={styles.postResults}>
                      {post.results.map((result, idx) => (
                        <div
                          key={idx}
                          className={`${styles.resultItem} ${result.success ? styles.success : styles.failed}`}
                        >
                          <span className={styles.resultPlatform}>{result.platform}</span>
                          {result.success ? (
                            <>
                              <span className={styles.resultStatus}>✓ Success</span>
                              {result.platformPostUrl && (
                                <a
                                  href={result.platformPostUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.resultLink}
                                >
                                  View Post →
                                </a>
                              )}
                            </>
                          ) : (
                            <>
                              <span className={styles.resultStatus}>✗ Failed</span>
                              {result.errorMessage && (
                                <span className={styles.resultError}>{result.errorMessage}</span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
