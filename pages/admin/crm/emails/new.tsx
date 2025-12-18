import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/admin/AdminLayout';
import styles from '../CRM.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type ContactList = {
  id: string;
  name: string;
  _count?: {
    contacts: number;
  };
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
};

export default function NewEmailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    listId: '',
    fromName: 'SUCCESS Magazine',
    fromEmail: 'news@success.com',
    sendNow: true,
    scheduledAt: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchLists();
      fetchTemplates();
    }
  }, [session]);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/crm/lists');
      const data = await res.json();
      setLists(data);
    } catch (error) {
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/crm/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    setFormData({
      ...formData,
      subject: template.subject,
      content: template.content,
    });
    setShowTemplateModal(false);
  };

  const handleSendEmail = async () => {
    if (!formData.subject || !formData.content || !formData.listId) {
      alert('Subject, content, and recipient list are required');
      return;
    }

    if (!formData.sendNow && !formData.scheduledAt) {
      alert('Please select a scheduled time or choose to send now');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/crm/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(formData.sendNow ? 'Email queued for sending!' : 'Email scheduled successfully!');
        router.push('/admin/crm');
      } else {
        const error = await res.json();
        alert(`Error: ${error.message || 'Failed to send email'}`);
      }
    } catch (error) {
      alert('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const selectedList = lists.find(l => l.id === formData.listId);

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>📧 Send New Email</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowTemplateModal(true)}
              className={styles.viewButton}
            >
              📄 Use Template
            </button>
            <button
              onClick={() => router.push('/admin/crm')}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className={styles.formContainer} style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Sender Info */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Sender Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>From Name *</label>
                <input
                  type="text"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  className={styles.input}
                  placeholder="SUCCESS Magazine"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>From Email *</label>
                <input
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  className={styles.input}
                  placeholder="news@success.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recipients</h2>
            <div className={styles.formGroup}>
              <label>Contact List *</label>
              <select
                value={formData.listId}
                onChange={(e) => setFormData({ ...formData, listId: e.target.value })}
                className={styles.input}
                required
              >
                <option value="">Select a list...</option>
                {lists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list._count?.contacts || 0} contacts)
                  </option>
                ))}
              </select>
              {selectedList && (
                <div className={styles.infoBox} style={{ marginTop: '0.5rem' }}>
                  ℹ️ This email will be sent to <strong>{selectedList._count?.contacts || 0}</strong> contacts in "{selectedList.name}"
                </div>
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Email Content</h2>

            <div className={styles.formGroup}>
              <label>Subject Line *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={styles.input}
                placeholder="Your email subject here..."
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email Body (HTML supported) *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className={styles.input}
                rows={18}
                placeholder="<p>Hi {{firstName}},</p>
<p>Your email content here...</p>
<p>Best regards,<br>The SUCCESS Team</p>"
                required
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
              <div className={styles.infoBox} style={{ marginTop: '0.5rem' }}>
                💡 <strong>Variables:</strong> Use {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, {'{{company}}'} to personalize
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Delivery</h2>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.sendNow}
                  onChange={(e) => setFormData({ ...formData, sendNow: e.target.checked })}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                Send immediately
              </label>
            </div>

            {!formData.sendNow && (
              <div className={styles.formGroup}>
                <label>Schedule For *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className={styles.input}
                  required={!formData.sendNow}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={() => router.push('/admin/crm')}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Sending...' : formData.sendNow ? '📤 Send Now' : '📅 Schedule Email'}
            </button>
          </div>
        </div>

        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Select Email Template</h2>
                <button onClick={() => setShowTemplateModal(false)} className={styles.closeButton}>
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                {templates.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No templates available. Create one first!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {templates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#000';
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                          {template.name}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          <strong>Subject:</strong> {template.subject}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
                          {template.content.substring(0, 120)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button onClick={() => setShowTemplateModal(false)} className={styles.cancelButton}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
