import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from '../posts/AdminPosts.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function PagesIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPages();
    }
  }, [session, statusFilter]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        per_page: '50',
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/pages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPages(pages.filter(p => p.id !== id));
      } else {
        alert('Failed to delete page');
      }
    } catch (error) {
      alert('Failed to delete page');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading pages...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      searchTerm === '' ||
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className={styles.postsPage}>
        <div className={styles.header}>
          <div>
            <h1>Pages</h1>
            <p className={styles.subtitle}>Manage static pages</p>
          </div>
          <Link href="/admin/pages/new" className={styles.newButton}>
            + New Page
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📄</div>
            <div className={styles.statContent}>
              <h3>Total Pages</h3>
              <p className={styles.statNumber}>{pages.length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <h3>Published</h3>
              <p className={styles.statNumber}>
                {pages.filter(p => p.status === 'PUBLISHED').length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statContent}>
              <h3>Drafts</h3>
              <p className={styles.statNumber}>
                {pages.filter(p => p.status === 'DRAFT').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.controls}>
          <div className={styles.filters}>
            <button
              className={statusFilter === 'all' ? styles.filterActive : styles.filterButton}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={statusFilter === 'PUBLISHED' ? styles.filterActive : styles.filterButton}
              onClick={() => setStatusFilter('PUBLISHED')}
            >
              Published
            </button>
            <button
              className={statusFilter === 'DRAFT' ? styles.filterActive : styles.filterButton}
              onClick={() => setStatusFilter('DRAFT')}
            >
              Drafts
            </button>
          </div>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Pages Table */}
        <div className={styles.tableContainer}>
          {filteredPages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No pages found</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Last Modified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => (
                  <tr key={page.id}>
                    <td>
                      <Link href={`/admin/pages/${page.id}`} className={styles.postTitle}>
                        {page.title}
                      </Link>
                    </td>
                    <td>
                      <code className={styles.slug}>/{page.slug}</code>
                    </td>
                    <td>
                      {page.status === 'PUBLISHED' ? (
                        <span className={styles.badgePublished}>Published</span>
                      ) : (
                        <span className={styles.badgeDraft}>Draft</span>
                      )}
                    </td>
                    <td>
                      {new Date(page.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/pages/${page.id}`}
                          className={styles.actionButton}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(page.id, page.title)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
