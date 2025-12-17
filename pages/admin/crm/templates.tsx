import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './CRM.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaigns: number;
  };
};

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    isDefault: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTemplates();
    }
  }, [session]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/crm/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.subject || !formData.content) {
      alert('Name, subject, and content are required');
      return;
    }

    try {
      const res = await fetch('/api/crm/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ name: '', subject: '', content: '', isDefault: false });
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name || !formData.subject || !formData.content) {
      alert('Name, subject, and content are required');
      return;
    }

    try {
      const res = await fetch(`/api/crm/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setEditingTemplate(null);
        setFormData({ name: '', subject: '', content: '', isDefault: false });
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await fetch(`/api/crm/templates/${id}`, {
        method: 'DELETE',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      isDefault: template.isDefault,
    });
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', content: '', isDefault: false });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading templates...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Email Templates</h1>
          <button onClick={() => router.push('/admin/crm/templates/new')} className={styles.addButton}>
            ➕ Create Template
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{templates.length}</div>
            <div className={styles.statLabel}>Total Templates</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {templates.filter(t => t.isDefault).length}
            </div>
            <div className={styles.statLabel}>Default Templates</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {templates.reduce((sum, t) => sum + (t._count?.campaigns || 0), 0)}
            </div>
            <div className={styles.statLabel}>Total Uses</div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className={styles.campaignsGrid}>
          {templates.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No email templates yet. Create your first template!</p>
            </div>
          ) : (
            templates.map(template => (
              <div key={template.id} className={styles.campaignCard}>
                <div className={styles.campaignHeader}>
                  <h3>{template.name}</h3>
                  {template.isDefault && (
                    <span className={`${styles.status} ${styles.statusACTIVE}`}>
                      DEFAULT
                    </span>
                  )}
                </div>

                <div className={styles.campaignSubject}>
                  <strong>Subject:</strong> {template.subject}
                </div>

                <div className={styles.campaignSubject}>
                  <strong>Content Preview:</strong>{' '}
                  {template.content.substring(0, 100)}
                  {template.content.length > 100 ? '...' : ''}
                </div>

                <div className={styles.campaignStats}>
                  <div className={styles.campaignStat}>
                    <span className={styles.campaignStatValue}>
                      {template._count?.campaigns || 0}
                    </span>
                    <span className={styles.campaignStatLabel}>Used in Campaigns</span>
                  </div>
                  <div className={styles.campaignStat}>
                    <span className={styles.campaignStatValue}>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                    <span className={styles.campaignStatLabel}>Created</span>
                  </div>
                </div>

                <div className={styles.campaignActions}>
                  <button
                    onClick={() => router.push(`/admin/crm/templates/${template.id}`)}
                    className={styles.viewButton}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className={styles.deleteButton}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Template Modal */}
        {(showCreateModal || editingTemplate) && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>{editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
                <button onClick={handleCancel} className={styles.closeButton}>
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={styles.input}
                    placeholder="Welcome Email Template"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className={styles.input}
                    placeholder="Welcome to SUCCESS Magazine!"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email Content * (HTML supported)</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className={styles.input}
                    rows={12}
                    placeholder="<p>Hi {{firstName}},</p><p>Welcome to SUCCESS Magazine!</p>"
                    required
                    style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    Set as default template
                  </label>
                </div>

                <div className={styles.infoBox}>
                  💡 <strong>Template Variables:</strong> Use {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, {'{{company}}'} to personalize emails
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={handleCancel} className={styles.cancelButton}>
                  Cancel
                </button>
                <button
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  className={styles.saveButton}
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
