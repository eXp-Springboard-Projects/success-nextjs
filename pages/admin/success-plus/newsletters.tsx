import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './SuccessPlus.module.css';

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: string;
  sentAt?: string;
  recipientCount?: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
  updatedAt: string;
}

export default function NewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'sent'>('all');

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/success-plus/newsletters');
      if (res.ok) {
        const data = await res.json();
        setNewsletters(data.newsletters || []);
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNewsletter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;

    try {
      const res = await fetch(`/api/admin/success-plus/newsletters/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNewsletters(newsletters.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  };

  const filteredNewsletters = newsletters.filter(newsletter => {
    if (filter === 'all') return true;
    return newsletter.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className={styles.statusPublished}>Sent</span>;
      case 'scheduled':
        return <span className={styles.statusPending}>Scheduled</span>;
      case 'draft':
        return <span className={styles.statusDraft}>Draft</span>;
      default:
        return <span className={styles.statusDraft}>{status}</span>;
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Newsletters"
      description="Create and manage SUCCESS+ newsletters"
    >
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1>Newsletters</h1>
            <p className={styles.pageDescription}>
              Create and send newsletters to SUCCESS+ members
            </p>
          </div>
          <Link href="/admin/success-plus/newsletters/new" className={styles.primaryButton}>
            📧 Create Newsletter
          </Link>
        </div>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.filterGroup}>
            <button
              className={`${styles.filterButton} ${filter === 'all' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({newsletters.length})
            </button>
            <button
              className={`${styles.filterButton} ${filter === 'draft' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('draft')}
            >
              Drafts ({newsletters.filter(n => n.status === 'draft').length})
            </button>
            <button
              className={`${styles.filterButton} ${filter === 'scheduled' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('scheduled')}
            >
              Scheduled ({newsletters.filter(n => n.status === 'scheduled').length})
            </button>
            <button
              className={`${styles.filterButton} ${filter === 'sent' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('sent')}
            >
              Sent ({newsletters.filter(n => n.status === 'sent').length})
            </button>
          </div>
        </div>

        {/* Newsletters Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⏳</div>
              <div>Loading newsletters...</div>
            </div>
          ) : filteredNewsletters.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>No newsletters found</h3>
              <p>Create your first newsletter to get started</p>
              <Link href="/admin/success-plus/newsletters/new" className={styles.primaryButton}>
                Create Newsletter
              </Link>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Recipients</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNewsletters.map((newsletter) => (
                  <tr key={newsletter.id}>
                    <td>
                      <div className={styles.newsletterTitle}>
                        {newsletter.subject}
                      </div>
                    </td>
                    <td>{getStatusBadge(newsletter.status)}</td>
                    <td>{newsletter.recipientCount || 0}</td>
                    <td>
                      {newsletter.openRate !== undefined
                        ? `${newsletter.openRate.toFixed(1)}%`
                        : '-'}
                    </td>
                    <td>
                      {newsletter.clickRate !== undefined
                        ? `${newsletter.clickRate.toFixed(1)}%`
                        : '-'}
                    </td>
                    <td>
                      {newsletter.status === 'sent' && newsletter.sentAt
                        ? new Date(newsletter.sentAt).toLocaleDateString()
                        : newsletter.status === 'scheduled' && newsletter.scheduledFor
                        ? new Date(newsletter.scheduledFor).toLocaleDateString()
                        : new Date(newsletter.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <Link
                          href={`/admin/success-plus/newsletters/${newsletter.id}`}
                          className={styles.iconButton}
                          title="View"
                        >
                          👁️
                        </Link>
                        {newsletter.status === 'draft' && (
                          <Link
                            href={`/admin/success-plus/newsletters/${newsletter.id}/edit`}
                            className={styles.iconButton}
                            title="Edit"
                          >
                            ✏️
                          </Link>
                        )}
                        {newsletter.status === 'draft' && (
                          <button
                            onClick={() => deleteNewsletter(newsletter.id)}
                            className={styles.iconButton}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
