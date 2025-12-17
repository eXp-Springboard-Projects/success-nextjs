import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import styles from '../../editorial/Editorial.module.css';

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  conversions: number;
  conversion_rate: number;
  created_at: string;
  published_at: string | null;
}

export default function LandingPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/crm/landing-pages');
      const data = await res.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error('Error fetching landing pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Duplicate this landing page?')) return;

    try {
      const res = await fetch(`/api/admin/crm/landing-pages/${id}/duplicate`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchPages();
      }
    } catch (error) {
      console.error('Error duplicating landing page:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this landing page? This action cannot be undone.')) return;

    try {
      await fetch(`/api/admin/crm/landing-pages/${id}`, {
        method: 'DELETE',
      });
      fetchPages();
    } catch (error) {
      console.error('Error deleting landing page:', error);
    }
  };

  const handlePreview = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/lp/${slug}`, '_blank');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Landing Pages">
        <div className={styles.loading}>Loading landing pages...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Landing Pages">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Landing Pages</h1>
            <p>Create and manage landing pages for campaigns</p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => router.push('/admin/crm/landing-pages/new')}
          >
            + Create Landing Page
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>URL</th>
                <th>Status</th>
                <th>Views</th>
                <th>Conversions</th>
                <th>Rate</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.id}
                  onClick={() => router.push(`/admin/crm/landing-pages/${page.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <strong>{page.title}</strong>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      /lp/{page.slug}
                    </code>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: page.status === 'published' ? '#dcfce7' : '#f3f4f6',
                        color: page.status === 'published' ? '#166534' : '#6b7280',
                      }}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td>{page.views.toLocaleString()}</td>
                  <td>{page.conversions.toLocaleString()}</td>
                  <td>
                    <strong style={{ color: page.conversion_rate > 5 ? '#22c55e' : '#6b7280' }}>
                      {page.conversion_rate.toFixed(1)}%
                    </strong>
                  </td>
                  <td>{formatDate(page.created_at)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => handlePreview(page.slug, e)}
                      >
                        Preview
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => handleDuplicate(page.id, e)}
                      >
                        Duplicate
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={(e) => handleDelete(page.id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📄</div>
              <div>No landing pages yet. Click "Create Landing Page" to get started.</div>
            </div>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}
