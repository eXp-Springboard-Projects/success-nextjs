import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { Plus, Edit, Trash2, Eye, EyeOff, HelpCircle, MessageSquare } from 'lucide-react';
import styles from './ContentManager.module.css';

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'FAQ' | 'Tutorial' | 'Guide' | 'Troubleshooting';
  author: string;
  thumbnail?: string;
  isPublished: boolean;
  viewCount: number;
  helpfulCount: number;
  createdAt: string;
  lastUpdated: string;
}

export default function HelpManager() {
  const router = useRouter();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchArticles();
  }, [filter]);

  const fetchArticles = async () => {
    setLoading(true);
    // TODO: Replace with actual API call
    // Mock data for now
    setTimeout(() => {
      setArticles([
        {
          id: '1',
          title: 'Getting Started with SUCCESS+',
          description: 'A comprehensive guide to using your membership',
          category: 'Getting Started',
          type: 'Guide',
          author: 'Support Team',
          isPublished: true,
          viewCount: 1847,
          helpfulCount: 234,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'How to Access Premium Courses',
          description: 'Step-by-step tutorial for accessing your courses',
          category: 'Courses',
          type: 'Tutorial',
          author: 'Support Team',
          isPublished: true,
          viewCount: 956,
          helpfulCount: 178,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    // TODO: API call to toggle publish status
    setArticles(articles.map(a =>
      a.id === id ? { ...a, isPublished: !currentStatus } : a
    ));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    // TODO: API call to delete
    setArticles(articles.filter(a => a.id !== id));
  };

  const filteredArticles = articles.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'published') return a.isPublished;
    if (filter === 'draft') return !a.isPublished;
    return true;
  });

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Help Center Manager"
      description="Manage SUCCESS+ help articles and support content"
    >
      <div className={styles.container}>
        {/* Header Actions */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard/help" className={styles.previewButton}>
              <Eye size={16} />
              Preview as Member
            </Link>
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={() => router.push('/admin/success-plus/help/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Add New Article
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? styles.filterActive : styles.filterButton}
          >
            All Articles ({articles.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={filter === 'published' ? styles.filterActive : styles.filterButton}
          >
            Published ({articles.filter(a => a.isPublished).length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={filter === 'draft' ? styles.filterActive : styles.filterButton}
          >
            Drafts ({articles.filter(a => !a.isPublished).length})
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><HelpCircle /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{articles.length}</div>
              <div className={styles.statLabel}>Total Articles</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><MessageSquare /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {articles.reduce((sum, a) => sum + a.viewCount, 0)}
              </div>
              <div className={styles.statLabel}>Total Views</div>
            </div>
          </div>
        </div>

        {/* Articles List */}
        {loading ? (
          <div className={styles.loading}>Loading articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>❓</div>
            <h3>No articles found</h3>
            <p>Get started by creating your first help article</p>
            <button
              onClick={() => router.push('/admin/success-plus/help/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Create Article
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Type</th>
                  <th>Author</th>
                  <th>Views</th>
                  <th>Helpful</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <div className={styles.courseCell}>
                        <div className={styles.courseThumbnail}>
                          {article.thumbnail ? (
                            <img src={article.thumbnail} alt={article.title} />
                          ) : (
                            <div className={styles.placeholderIcon}>❓</div>
                          )}
                        </div>
                        <div>
                          <div className={styles.courseTitle}>{article.title}</div>
                          <div className={styles.courseCategory}>{article.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${article.type}`]}`}>
                        {article.type}
                      </span>
                    </td>
                    <td>{article.author}</td>
                    <td>{article.viewCount.toLocaleString()}</td>
                    <td>{article.helpfulCount}</td>
                    <td>
                      <span className={`${styles.badge} ${article.isPublished ? styles.badgeSuccess : styles.badgeDraft}`}>
                        {article.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => router.push(`/admin/success-plus/help/${article.id}/edit`)}
                          className={styles.iconButton}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(article.id, article.isPublished)}
                          className={styles.iconButton}
                          title={article.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {article.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
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
