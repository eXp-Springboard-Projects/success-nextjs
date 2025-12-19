/**
 * Bulk Staff Invitation Page
 * Allows admins to invite multiple staff members at once via email
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './StaffInvite.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface InviteResult {
  success: { email: string; code: string; emailSent: boolean }[];
  failed: { email: string; error: string }[];
  skipped: string[];
}

export default function BulkStaffInvite() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emailsText, setEmailsText] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [sendEmails, setSendEmails] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<InviteResult | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Only SUPER_ADMIN and ADMIN can access
      if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setLoading(true);

    try {
      // Parse emails (comma or newline separated)
      const emailList = emailsText
        .split(/[\n,]/)
        .map(e => e.trim())
        .filter(e => e.length > 0);

      if (emailList.length === 0) {
        throw new Error('Please enter at least one email address');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailList.filter(e => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      }

      const res = await fetch('/api/admin/invites/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailList,
          role,
          expiresInDays,
          sendEmails,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invites');
      }

      setResults(data.results);

      // Clear form if all succeeded
      if (data.results.failed.length === 0) {
        setEmailsText('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create invites');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
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
            <h1>📧 Bulk Invite Staff Members</h1>
            <p className={styles.subtitle}>
              Invite multiple staff members at once via email
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/staff')}
            className={styles.backButton}
          >
            ← Back to Staff
          </button>
        </div>

        <div className={styles.card} style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="emails">
                Email Addresses *
                <small style={{ display: 'block', marginTop: '0.5rem' }}>
                  Enter email addresses separated by commas or new lines
                </small>
              </label>
              <textarea
                id="emails"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                placeholder="staff1@example.com&#10;staff2@example.com&#10;staff3@example.com"
                className={styles.textarea}
                rows={8}
                required
                style={{ fontFamily: 'monospace', fontSize: '14px' }}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="role">Default Role *</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="EDITOR">Editor</option>
                  <option value="AUTHOR">Author</option>
                  {session.user?.role === 'SUPER_ADMIN' && (
                    <>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </>
                  )}
                </select>
                <small>All invites will start with this role. You can change roles later in the admin dashboard.</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="expiresInDays">Expires In (Days)</label>
                <input
                  id="expiresInDays"
                  type="number"
                  min="1"
                  max="90"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={sendEmails}
                  onChange={(e) => setSendEmails(e.target.checked)}
                  className={styles.checkbox}
                />
                Send invitation emails automatically
              </label>
              <small>
                When enabled, each staff member will receive an email with their unique invite link.
              </small>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {results && (
              <div style={{ marginTop: '1.5rem' }}>
                {results.success.length > 0 && (
                  <div className={styles.success} style={{ marginBottom: '1rem' }}>
                    <strong>✅ Successfully created {results.success.length} invites</strong>
                    <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {results.success.map((item, i) => (
                        <div key={i} style={{ fontSize: '0.9rem', marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '4px' }}>
                          <div><strong>{item.email}</strong></div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>
                            Code: {item.code} | Email {item.emailSent ? 'sent ✉️' : 'not sent'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.skipped.length > 0 && (
                  <div style={{ padding: '1rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', marginBottom: '1rem' }}>
                    <strong>⚠️ Skipped {results.skipped.length} existing users:</strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {results.skipped.join(', ')}
                    </div>
                  </div>
                )}

                {results.failed.length > 0 && (
                  <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #dc2626', borderRadius: '6px' }}>
                    <strong>❌ Failed to create {results.failed.length} invites:</strong>
                    <div style={{ marginTop: '1rem' }}>
                      {results.failed.map((item, i) => (
                        <div key={i} style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          {item.email}: {item.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
              style={{ marginTop: '1.5rem' }}
            >
              {loading ? 'Creating Invites...' : `Create Invites ${sendEmails ? '& Send Emails' : ''}`}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '6px' }}>
            <strong>💡 Tip:</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li>Paste email addresses from a spreadsheet or list</li>
              <li>Emails already in the system will be skipped</li>
              <li>All staff members start as {role}, but you can change their role later</li>
              <li>Invite links will be sent automatically if "Send emails" is checked</li>
              <li>Invites expire after {expiresInDays} days</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
