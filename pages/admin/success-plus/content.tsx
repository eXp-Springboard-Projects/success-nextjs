import { useEffect, useState } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './SuccessPlus.module.css';

interface PremiumPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  contentType: string;
  accessTier: string;
  publishedAt: string | null;
  author: {
    name: string;
    email?: string;
  };
  categories: Array<{
    name: string;
    slug: string;
  }>;
}

export default function SuccessPlusContent() {
  const router = useRouter();
  const [posts, setPosts] = useState<PremiumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'premium' | 'insider'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'publish' | 'draft'>('all');

  useEffect(() => {
    fetchPremiumContent();
  }, [filter, statusFilter]);

  const fetchPremiumContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('contentType', filter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/success-plus/content?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching premium content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccessTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <span className={styles.badgeFree}>Free Preview</span>;
      case 'success_plus':
        return <span className={styles.badgePremium}>SUCCESS+</span>;
      case 'insider':
        return <span className={styles.badgeInsider}>⭐ Insider</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
      case 'publish':
        return <span className={styles.statusPublished}>Published</span>;
      case 'DRAFT':
      case 'draft':
        return <span className={styles.statusDraft}>Draft</span>;
      case 'pending':
        return <span className={styles.statusPending}>Pending</span>;
      default:
        return <span className={styles.statusDraft}>{status}</span>;
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Premium Content"
      description="Manage SUCCESS+ exclusive articles, insider content, and premium posts"
    >
      <div className={styles.contentManagement}>
        {/* Header Actions */}
        <div className={styles.contentHeader}>
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <label>Content Type:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className={styles.filterSelect}
              >
                <option value="all">All Premium Content</option>
                <option value="premium">SUCCESS+ Only</option>
                <option value="insider">Insider Only</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="publish">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <Link href="/admin/success-plus/content/new" className={styles.createButton}>
            + New Premium Article
          </Link>
        </div>

        {/* Content Stats */}
        <div className={styles.statsRow}>
          <div className={styles.miniStat}>
            <span className={styles.miniStatLabel}>Total Premium</span>
            <span className={styles.miniStatValue}>{posts.length}</span>
          </div>
          <div className={styles.miniStat}>
            <span className={styles.miniStatLabel}>Published</span>
            <span className={styles.miniStatValue}>
              {posts.filter((p) => p.status === 'PUBLISHED' || p.status === 'publish').length}
            </span>
          </div>
          <div className={styles.miniStat}>
            <span className={styles.miniStatLabel}>Drafts</span>
            <span className={styles.miniStatValue}>
              {posts.filter((p) => p.status === 'DRAFT' || p.status === 'draft').length}
            </span>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className={styles.loading}>Loading premium content...</div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💎</div>
            <h3>No Premium Content Yet</h3>
            <p>Start creating premium articles for SUCCESS+ members</p>
            <Link href="/admin/success-plus/content/new" className={styles.createButton}>
              Create First Premium Article
            </Link>
          </div>
        ) : (
          <div className={styles.contentTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Access Tier</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Author</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className={styles.titleCell}>
                      <Link href={`/admin/posts/${post.id}/edit`} className={styles.postTitle}>
                        {post.title}
                      </Link>
                      {post.categories.length > 0 && (
                        <div className={styles.categories}>
                          {post.categories.slice(0, 2).map((cat, i) => (
                            <span key={i} className={styles.categoryTag}>
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={styles.contentTypeBadge}>
                        {post.contentType === 'premium' && '💎 Premium Article'}
                        {post.contentType === 'insider' && '⭐ Insider Article'}
                        {post.contentType === 'magazine' && '📖 Magazine'}
                        {!post.contentType && 'Premium Article'}
                      </span>
                    </td>
                    <td>{getAccessTierBadge(post.accessTier)}</td>
                    <td>{getStatusBadge(post.status)}</td>
                    <td className={styles.dateCell}>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>{post.author?.name || 'Unknown'}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className={styles.actionButton}
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className={styles.actionButton}
                        >
                          View
                        </Link>
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
