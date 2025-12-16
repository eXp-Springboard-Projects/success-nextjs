import { useEffect, useState } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from '../../editorial/Editorial.module.css';

interface UnsubscribedContact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  unsubscribedAt: string;
  unsubscribeReason: string | null;
  optInMarketing: boolean;
  optInNewsletter: boolean;
  optInTransactional: boolean;
}

export default function UnsubscribesIndex() {
  const [unsubscribes, setUnsubscribes] = useState<UnsubscribedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUnsubscribes();
  }, []);

  const fetchUnsubscribes = async () => {
    try {
      const res = await fetch('/api/admin/crm/unsubscribes');
      const data = await res.json();
      setUnsubscribes(data);
    } catch (error) {
      console.error('Failed to fetch unsubscribes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async (id: string) => {
    if (!confirm('Resubscribe this contact to all emails?')) return;

    try {
      const res = await fetch(`/api/admin/crm/unsubscribes/${id}/resubscribe`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchUnsubscribes();
      }
    } catch (error) {
      console.error('Failed to resubscribe:', error);
    }
  };

  const filteredUnsubscribes = unsubscribes.filter((u) => {
    const matchesSearch = search
      ? u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesFilter = filter === 'all' || u.unsubscribeReason === filter;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: unsubscribes.length,
    marketing: unsubscribes.filter((u) => !u.optInMarketing).length,
    newsletter: unsubscribes.filter((u) => !u.optInNewsletter).length,
    transactional: unsubscribes.filter((u) => !u.optInTransactional).length,
  };

  const reasonCounts = unsubscribes.reduce((acc, u) => {
    const reason = u.unsubscribeReason || 'no_reason';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DepartmentLayout
      currentDepartment={Department.SUPER_ADMIN}
      pageTitle="Unsubscribed Contacts"
      description="Manage unsubscribed contacts and email preferences"
    >
      <div className={styles.dashboard}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📧</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Total Unsubscribed</div>
              <div className={styles.statValue}>{loading ? '...' : stats.total}</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📢</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Opted Out: Marketing</div>
              <div className={styles.statValue}>{loading ? '...' : stats.marketing}</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📰</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Opted Out: Newsletter</div>
              <div className={styles.statValue}>{loading ? '...' : stats.newsletter}</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔔</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Opted Out: Transactional</div>
              <div className={styles.statValue}>{loading ? '...' : stats.transactional}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.section}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: '250px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Reasons</option>
              <option value="too_frequent">Too Frequent</option>
              <option value="not_relevant">Not Relevant</option>
              <option value="never_signed_up">Never Signed Up</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
              <option value="no_reason">No Reason Given</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : filteredUnsubscribes.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <div>No unsubscribed contacts found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Unsubscribed
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Reason
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Preferences
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnsubscribes.map((contact) => (
                    <tr
                      key={contact.id}
                      style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                        {contact.email}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                        {contact.firstName || contact.lastName
                          ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                          : '-'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {new Date(contact.unsubscribedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {contact.unsubscribeReason
                          ? contact.unsubscribeReason.replace(/_/g, ' ')
                          : '-'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {!contact.optInMarketing && (
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                              }}
                            >
                              No Marketing
                            </span>
                          )}
                          {!contact.optInNewsletter && (
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                              }}
                            >
                              No Newsletter
                            </span>
                          )}
                          {!contact.optInTransactional && (
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#e0e7ff',
                                color: #1e40af',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                              }}
                            >
                              No Transactional
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleResubscribe(contact.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}
                        >
                          Resubscribe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reason Stats */}
        {!loading && Object.keys(reasonCounts).length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Unsubscribe Reasons</h2>
            <div className={styles.miniStatsGrid}>
              {Object.entries(reasonCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([reason, count]) => (
                  <div key={reason} className={styles.miniStat}>
                    <div className={styles.miniStatValue}>{count}</div>
                    <div className={styles.miniStatLabel}>
                      {reason === 'no_reason' ? 'No Reason' : reason.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUPER_ADMIN);
