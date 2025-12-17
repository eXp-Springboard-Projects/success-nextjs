import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import EmailBuilder, { EmailBlock, generateHTML } from '../../../../components/admin/crm/EmailBuilder';
import styles from '../../editorial/Editorial.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  blocks: EmailBlock[] | null;
  isDefault: boolean;
}

export default function TemplateEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    blocks: [] as EmailBlock[],
    isDefault: false,
  });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchTemplate();
    } else if (id === 'new') {
      setLoading(false);
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/crm/templates/${id}`);
      const data = await res.json();
      setTemplate(data);

      let blocks: EmailBlock[] = [];
      try {
        if (data.blocks) {
          blocks = typeof data.blocks === 'string' ? JSON.parse(data.blocks) : data.blocks;
        }
      } catch (e) {
        console.error('Error parsing blocks:', e);
      }

      setFormData({
        name: data.name,
        subject: data.subject,
        content: data.content,
        blocks,
        isDefault: data.isDefault,
      });

      if (blocks.length > 0) {
        setEditorMode('visual');
      } else {
        setEditorMode('html');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject) {
      alert('Name and subject are required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        subject: formData.subject,
        content: editorMode === 'visual' ? generateHTML(formData.blocks) : formData.content,
        blocks: editorMode === 'visual' ? JSON.stringify(formData.blocks) : null,
        isDefault: formData.isDefault,
      };

      const url = id === 'new' ? '/api/crm/templates' : `/api/crm/templates/${id}`;
      const method = id === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (id === 'new') {
          router.push('/admin/crm/templates');
        } else {
          alert('Template saved successfully');
          fetchTemplate();
        }
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this template? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/crm/templates/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/admin/crm/templates');
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleModeSwitch = (newMode: 'visual' | 'html') => {
    if (newMode === 'html' && editorMode === 'visual') {
      const html = generateHTML(formData.blocks);
      setFormData(prev => ({ ...prev, content: html }));
    } else if (newMode === 'visual' && editorMode === 'html') {
      if (!confirm('Switching to visual editor will reset your HTML. Continue?')) {
        return;
      }
      setFormData(prev => ({ ...prev, blocks: [] }));
    }
    setEditorMode(newMode);
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Loading...">
        <div className={styles.loading}>Loading template...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle={id === 'new' ? 'New Template' : 'Edit Template'}>
      <div className={styles.container}>
        <a href="/admin/crm/templates" className={styles.backLink}>
          ← Back to Templates
        </a>

        <div className={styles.header}>
          <h1>{id === 'new' ? 'New Email Template' : 'Edit Email Template'}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className={styles.primaryButton}
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
            {id !== 'new' && (
              <button
                onClick={handleDelete}
                className={`${styles.secondaryButton} ${styles.deleteButton}`}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.formGroup}>
            <label>Template Name *</label>
            <input
              type="text"
              className={styles.input}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Welcome Email Template"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email Subject *</label>
            <input
              type="text"
              className={styles.input}
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Welcome to SUCCESS Magazine!"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              Set as default template
            </label>
          </div>

          <div style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#1e40af' }}>
            💡 <strong>Template Variables:</strong> Use {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, {'{{company}}'} to personalize emails
          </div>
        </div>

        <div className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Email Content</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleModeSwitch('visual')}
                className={editorMode === 'visual' ? styles.primaryButton : styles.secondaryButton}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                🎨 Visual Builder
              </button>
              <button
                onClick={() => handleModeSwitch('html')}
                className={editorMode === 'html' ? styles.primaryButton : styles.secondaryButton}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                {'</>'} HTML Editor
              </button>
            </div>
          </div>

          {editorMode === 'visual' ? (
            <EmailBuilder
              initialBlocks={formData.blocks}
              onChange={(blocks) => setFormData(prev => ({ ...prev, blocks }))}
            />
          ) : (
            <div className={styles.formGroup}>
              <label>HTML Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className={styles.textarea}
                rows={20}
                placeholder="<p>Hi {{firstName}},</p><p>Welcome to SUCCESS Magazine!</p>"
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.push('/admin/crm/templates')}
            className={styles.secondaryButton}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.primaryButton}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
