import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { Plus, Edit, Trash2, Eye, EyeOff, Users, MessageCircle } from 'lucide-react';
import styles from './ContentManager.module.css';

interface CommunityPost {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  type: 'Discussion' | 'Question' | 'Announcement' | 'Poll';
  thumbnail?: string;
  isPublished: boolean;
  isPinned: boolean;
  replyCount: number;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  lastActivity: string;
}

export default function CommunityManager() {
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    // TODO: Replace with actual API call
    // Mock data for now
    setTimeout(() => {
      setPosts([
        {
          id: '1',
          title: 'Welcome to the SUCCESS+ Community',
          description: 'Introduce yourself and share your success journey',
          author: 'Admin',
          category: 'Introductions',
          type: 'Announcement',
          isPublished: true,
          isPinned: true,
          replyCount: 156,
          likeCount: 234,
          viewCount: 2847,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Best Time Management Techniques?',
          description: 'What are your favorite productivity hacks?',
          author: 'Sarah M.',
          category: 'Productivity',
          type: 'Discussion',
          isPublished: true,
          isPinned: false,
          replyCount: 43,
          likeCount: 87,
          viewCount: 892,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    // TODO: API call to toggle publish status
    setPosts(posts.map(p =>
      p.id === id ? { ...p, isPublished: !currentStatus } : p
    ));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    // TODO: API call to delete
    setPosts(posts.filter(p => p.id !== id));
  };

  const filteredPosts = posts.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'published') return p.isPublished;
    if (filter === 'draft') return !p.isPublished;
    return true;
  });

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Community Manager"
      description="Manage SUCCESS+ community posts and discussions"
    >
      <div className={styles.container}>
        {/* Header Actions */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard/community" className={styles.previewButton}>
              <Eye size={16} />
              Preview as Member
            </Link>
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={() => router.push('/admin/success-plus/community/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Add New Post
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? styles.filterActive : styles.filterButton}
          >
            All Posts ({posts.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={filter === 'published' ? styles.filterActive : styles.filterButton}
          >
            Published ({posts.filter(p => p.isPublished).length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={filter === 'draft' ? styles.filterActive : styles.filterButton}
          >
            Drafts ({posts.filter(p => !p.isPublished).length})
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><MessageCircle /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{posts.length}</div>
              <div className={styles.statLabel}>Total Posts</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Users /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {posts.reduce((sum, p) => sum + p.replyCount, 0)}
              </div>
              <div className={styles.statLabel}>Total Replies</div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className={styles.loading}>Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>No posts found</h3>
            <p>Get started by creating your first community post</p>
            <button
              onClick={() => router.push('/admin/success-plus/community/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Create Post
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Author</th>
                  <th>Type</th>
                  <th>Replies</th>
                  <th>Likes</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className={styles.courseCell}>
                        <div className={styles.courseThumbnail}>
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt={post.title} />
                          ) : (
                            <div className={styles.placeholderIcon}>💬</div>
                          )}
                        </div>
                        <div>
                          <div className={styles.courseTitle}>
                            {post.isPinned && '📌 '}
                            {post.title}
                          </div>
                          <div className={styles.courseCategory}>{post.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>{post.author}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${post.type}`]}`}>
                        {post.type}
                      </span>
                    </td>
                    <td>{post.replyCount}</td>
                    <td>{post.likeCount}</td>
                    <td>{post.viewCount.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${post.isPublished ? styles.badgeSuccess : styles.badgeDraft}`}>
                        {post.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => router.push(`/admin/success-plus/community/${post.id}/edit`)}
                          className={styles.iconButton}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(post.id, post.isPublished)}
                          className={styles.iconButton}
                          title={post.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {post.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
