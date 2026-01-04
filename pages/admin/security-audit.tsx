import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from './Members.module.css';

interface AuditResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
  posts: any[];
  pages: any[];
  media: any[];
  activities: any[];
  adminActions: any[];
  departments: any[];
}

export default function SecurityAuditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('bagasramadhan88888@success.com');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const runAudit = async () => {
    setLoading(true);
    setError('');
    setAuditResult(null);
    setSummary(null);

    try {
      const res = await fetch('/api/admin/audit-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to audit user');
        return;
      }

      setAuditResult(data.audit);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to audit user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!auditResult) return;

    if (!confirm(`Are you sure you want to delete ${auditResult.user.email}?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/staff/delete-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auditResult.user.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete user');
        return;
      }

      setDeleteSuccess(true);
      setAuditResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem' }}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <h1>🔒 Security Audit</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Audit user activity and delete unauthorized accounts
        </p>

        <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              User Email to Audit
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
          </div>

          <button
            onClick={runAudit}
            disabled={loading || !email}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading ? '#ccc' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Running Audit...' : 'Run Security Audit'}
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '2rem',
            color: '#c00',
          }}>
            ❌ {error}
          </div>
        )}

        {deleteSuccess && (
          <div style={{
            background: '#efe',
            border: '1px solid #cfc',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '2rem',
            color: '#060',
          }}>
            ✅ User successfully deleted from database
          </div>
        )}

        {summary && auditResult && (
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px' }}>
            <h2>Audit Results for {auditResult.user.email}</h2>

            <div style={{
              background: summary.hasChanges ? '#fff3cd' : '#d4edda',
              border: `1px solid ${summary.hasChanges ? '#ffc107' : '#28a745'}`,
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '2rem',
            }}>
              <strong>{summary.hasChanges ? '⚠️ REVIEW REQUIRED' : '✅ SAFE TO DELETE'}</strong>
              <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                {summary.hasChanges
                  ? 'This user has made changes to the site. Review details below.'
                  : 'No content or changes detected.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: summary.postsCount > 0 ? '#dc3545' : '#28a745' }}>
                  {summary.postsCount}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Posts Created</div>
              </div>
              <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: summary.pagesCount > 0 ? '#dc3545' : '#28a745' }}>
                  {summary.pagesCount}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Pages Created</div>
              </div>
              <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: summary.mediaCount > 0 ? '#dc3545' : '#28a745' }}>
                  {summary.mediaCount}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Media Uploaded</div>
              </div>
            </div>

            <h3>User Profile</h3>
            <table style={{ width: '100%', marginBottom: '2rem' }}>
              <tbody>
                <tr><td style={{ padding: '0.5rem', background: '#f5f5f5' }}><strong>Name:</strong></td><td style={{ padding: '0.5rem' }}>{auditResult.user.name}</td></tr>
                <tr><td style={{ padding: '0.5rem', background: '#f5f5f5' }}><strong>Email:</strong></td><td style={{ padding: '0.5rem' }}>{auditResult.user.email}</td></tr>
                <tr><td style={{ padding: '0.5rem', background: '#f5f5f5' }}><strong>Role:</strong></td><td style={{ padding: '0.5rem' }}>{auditResult.user.role}</td></tr>
                <tr><td style={{ padding: '0.5rem', background: '#f5f5f5' }}><strong>Created:</strong></td><td style={{ padding: '0.5rem' }}>{new Date(auditResult.user.createdAt).toLocaleString()}</td></tr>
                <tr><td style={{ padding: '0.5rem', background: '#f5f5f5' }}><strong>Last Login:</strong></td><td style={{ padding: '0.5rem' }}>{auditResult.user.lastLoginAt ? new Date(auditResult.user.lastLoginAt).toLocaleString() : 'Never'}</td></tr>
              </tbody>
            </table>

            {auditResult.posts.length > 0 && (
              <>
                <h3>⚠️ Posts Created ({auditResult.posts.length})</h3>
                <ul style={{ marginBottom: '2rem' }}>
                  {auditResult.posts.map(post => (
                    <li key={post.id}>
                      <strong>{post.title}</strong> ({post.status})
                      <br />
                      <small>/{post.slug} - Created: {new Date(post.createdAt).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {auditResult.pages.length > 0 && (
              <>
                <h3>⚠️ Pages Created ({auditResult.pages.length})</h3>
                <ul style={{ marginBottom: '2rem' }}>
                  {auditResult.pages.map(page => (
                    <li key={page.id}>
                      <strong>{page.title}</strong> ({page.status})
                      <br />
                      <small>/{page.slug} - Created: {new Date(page.createdAt).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {auditResult.media.length > 0 && (
              <>
                <h3>⚠️ Media Uploaded ({auditResult.media.length})</h3>
                <ul style={{ marginBottom: '2rem' }}>
                  {auditResult.media.map(file => (
                    <li key={file.id}>
                      <strong>{file.filename}</strong> ({file.mimeType})
                      <br />
                      <small>{file.url} - {new Date(file.createdAt).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #ddd' }}>
              <button
                onClick={deleteUser}
                disabled={deleting}
                style={{
                  padding: '1rem 2rem',
                  background: deleting ? '#ccc' : '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {deleting ? 'Deleting...' : '🗑️ Delete This User'}
              </button>
              <p style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
                ⚠️ Note: If the user has an active session, it will remain valid for up to 8 hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
