import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from '../Forms.module.css';

interface Submission {
  id: string;
  data: any;
  source: string | null;
  ipAddress: string | null;
  createdAt: string;
  contact: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export default function FormSubmissions() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (id) {
      fetchForm();
      fetchSubmissions();
    }
  }, [id, page]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/admin/crm/forms/${id}`);
      const data = await res.json();
      setForm(data);
    } catch (error) {
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/crm/forms/${id}/submissions?page=${page}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setPagination(data.pagination);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (submissions.length === 0) return;

    // Get all unique field names from submissions
    const allFields = new Set<string>();
    submissions.forEach(sub => {
      Object.keys(sub.data).forEach(key => allFields.add(key));
    });

    const fields = Array.from(allFields);
    const headers = ['Submitted At', 'Contact Email', 'Contact Name', 'IP Address', ...fields];

    const rows = submissions.map(sub => {
      const contactName = sub.contact
        ? `${sub.contact.firstName || ''} ${sub.contact.lastName || ''}`.trim()
        : '';

      return [
        new Date(sub.createdAt).toLocaleString(),
        sub.contact?.email || '',
        contactName,
        sub.ipAddress || '',
        ...fields.map(field => sub.data[field] || ''),
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form?.name || 'form'}-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && !submissions.length) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <button
              onClick={() => router.push('/admin/crm/forms')}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '0.5rem' }}
            >
              ← Back to Forms
            </button>
            <h1>{form?.name} - Submissions</h1>
            <p>{pagination?.total || 0} total submissions</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className={styles.buttonSecondary}
              onClick={() => router.push(`/admin/crm/forms/${id}`)}
            >
              Edit Form
            </button>
            <button
              className={styles.primaryButton}
              onClick={exportToCSV}
              disabled={submissions.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Submitted</th>
                    <th>Contact</th>
                    <th>IP Address</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyState}>
                        No submissions yet
                      </td>
                    </tr>
                  ) : (
                    submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>{new Date(submission.createdAt).toLocaleString()}</td>
                        <td>
                          {submission.contact ? (
                            <div>
                              <strong>{submission.contact.email}</strong>
                              {(submission.contact.firstName || submission.contact.lastName) && (
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                  {submission.contact.firstName} {submission.contact.lastName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>No contact</span>
                          )}
                        </td>
                        <td>{submission.ipAddress || '-'}</td>
                        <td style={{ fontSize: '0.85rem', color: '#666' }}>
                          {submission.source ? (
                            <a href={submission.source} target="_blank" rel="noopener noreferrer">
                              {new URL(submission.source).hostname}
                            </a>
                          ) : '-'}
                        </td>
                        <td>
                          <button
                            className={styles.actionButton}
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span style={{ padding: '0.75rem' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Submission Details</h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Submitted</div>
                <div>{new Date(selectedSubmission.createdAt).toLocaleString()}</div>
              </div>

              {selectedSubmission.contact && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Contact</div>
                  <div>
                    <strong>{selectedSubmission.contact.email}</strong>
                    {(selectedSubmission.contact.firstName || selectedSubmission.contact.lastName) && (
                      <div>{selectedSubmission.contact.firstName} {selectedSubmission.contact.lastName}</div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Form Data</div>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                  {Object.entries(selectedSubmission.data).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                        {key}
                      </div>
                      <div>{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubmission.source && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Source URL</div>
                  <a href={selectedSubmission.source} target="_blank" rel="noopener noreferrer">
                    {selectedSubmission.source}
                  </a>
                </div>
              )}

              {selectedSubmission.ipAddress && (
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>IP Address</div>
                  <div>{selectedSubmission.ipAddress}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
