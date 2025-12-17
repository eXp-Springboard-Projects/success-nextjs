import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import styles from '../../editorial/Editorial.module.css';

interface Block {
  id: string;
  type: 'hero' | 'text' | 'image' | 'form' | 'cta';
  content: any;
}

interface Form {
  id: string;
  name: string;
}

export default function LandingPageEditor() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    template: 'minimal',
    formId: '',
    status: 'draft',
    content: [] as Block[],
  });

  useEffect(() => {
    fetchForms();
    if (!isNew && id) {
      fetchPage();
    }
  }, [id]);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/admin/crm/landing-pages/${id}`);
      const data = await res.json();
      setFormData({
        title: data.title,
        slug: data.slug,
        metaTitle: data.meta_title || '',
        metaDescription: data.meta_description || '',
        template: data.template,
        formId: data.form_id || '',
        status: data.status,
        content: data.content || [],
      });
    } catch (error) {
      console.error('Error fetching page:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/admin/crm/forms');
      const data = await res.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Please enter a title');
      return;
    }

    setSaving(true);

    try {
      const url = isNew ? '/api/admin/crm/landing-pages' : `/api/admin/crm/landing-pages/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          metaTitle: formData.metaTitle || formData.title,
          metaDescription: formData.metaDescription,
          template: formData.template,
          formId: formData.formId || null,
          status: formData.status,
          content: formData.content,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          router.push(`/admin/crm/landing-pages/${data.id}`);
        } else {
          alert('Page saved successfully');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save page');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
    };

    setFormData(prev => ({
      ...prev,
      content: [...prev.content, newBlock],
    }));

    setShowBlockMenu(false);
  };

  const getDefaultContent = (type: Block['type']) => {
    switch (type) {
      case 'hero':
        return { heading: 'Your Headline Here', subheading: 'Your subheading here', buttonText: 'Get Started', buttonUrl: '#' };
      case 'text':
        return { text: 'Your content here...' };
      case 'image':
        return { url: '', alt: '', caption: '' };
      case 'form':
        return { formId: '' };
      case 'cta':
        return { text: 'Ready to get started?', buttonText: 'Sign Up Now', buttonUrl: '#' };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, content: any) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.map(block =>
        block.id === blockId ? { ...block, content } : block
      ),
    }));
  };

  const removeBlock = (blockId: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter(block => block.id !== blockId),
    }));
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = formData.content.findIndex(b => b.id === blockId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.content.length - 1) return;

    const newContent = [...formData.content];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newContent[index], newContent[targetIndex]] = [newContent[targetIndex], newContent[index]];

    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/lp/${formData.slug}`, '_blank');
    } else {
      alert('Please save the page first to preview');
    }
  };

  const handlePublish = async () => {
    const newStatus = formData.status === 'published' ? 'draft' : 'published';
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Landing Page Editor">
        <div className={styles.loading}>Loading page...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle={isNew ? "New Landing Page" : "Edit Landing Page"}>
      <div className={styles.container}>
        <a href="/admin/crm/landing-pages" className={styles.backLink}>
          ← Back to Landing Pages
        </a>

        <div className={styles.header}>
          <h1>{isNew ? 'New Landing Page' : 'Edit Landing Page'}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          {/* Main Editor */}
          <div>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Page Settings</h2>

              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      title,
                      slug: isNew ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : prev.slug,
                    }));
                  }}
                  placeholder="Landing Page Title"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Slug *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="page-slug"
                  />
                  <small style={{ color: '#6b7280' }}>URL: /lp/{formData.slug}</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Template</label>
                  <select
                    className={styles.input}
                    value={formData.template}
                    onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                  >
                    <option value="minimal">Minimal</option>
                    <option value="full-width">Full Width</option>
                    <option value="with-sidebar">With Sidebar</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>SEO Settings</h2>

              <div className={styles.formGroup}>
                <label>Meta Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.metaTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder={formData.title}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Meta Description</label>
                <textarea
                  className={styles.textarea}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Brief description for search engines"
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Content Blocks</h2>
                <button
                  className={styles.primaryButton}
                  onClick={() => setShowBlockMenu(!showBlockMenu)}
                >
                  + Add Block
                </button>
              </div>

              {showBlockMenu && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <button className={styles.secondaryButton} onClick={() => addBlock('hero')}>Hero</button>
                  <button className={styles.secondaryButton} onClick={() => addBlock('text')}>Text</button>
                  <button className={styles.secondaryButton} onClick={() => addBlock('image')}>Image</button>
                  <button className={styles.secondaryButton} onClick={() => addBlock('form')}>Form</button>
                  <button className={styles.secondaryButton} onClick={() => addBlock('cta')}>CTA</button>
                </div>
              )}

              {formData.content.map((block, index) => (
                <div key={block.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <strong style={{ textTransform: 'capitalize' }}>{block.type} Block</strong>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {index > 0 && (
                        <button className={styles.actionButton} onClick={() => moveBlock(block.id, 'up')}>↑</button>
                      )}
                      {index < formData.content.length - 1 && (
                        <button className={styles.actionButton} onClick={() => moveBlock(block.id, 'down')}>↓</button>
                      )}
                      <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => removeBlock(block.id)}>Remove</button>
                    </div>
                  </div>

                  {block.type === 'hero' && (
                    <>
                      <input
                        className={styles.input}
                        value={block.content.heading}
                        onChange={(e) => updateBlock(block.id, { ...block.content, heading: e.target.value })}
                        placeholder="Headline"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <input
                        className={styles.input}
                        value={block.content.subheading}
                        onChange={(e) => updateBlock(block.id, { ...block.content, subheading: e.target.value })}
                        placeholder="Subheading"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          className={styles.input}
                          value={block.content.buttonText}
                          onChange={(e) => updateBlock(block.id, { ...block.content, buttonText: e.target.value })}
                          placeholder="Button Text"
                        />
                        <input
                          className={styles.input}
                          value={block.content.buttonUrl}
                          onChange={(e) => updateBlock(block.id, { ...block.content, buttonUrl: e.target.value })}
                          placeholder="Button URL"
                        />
                      </div>
                    </>
                  )}

                  {block.type === 'text' && (
                    <textarea
                      className={styles.textarea}
                      value={block.content.text}
                      onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                      placeholder="Your content here..."
                      rows={5}
                    />
                  )}

                  {block.type === 'image' && (
                    <>
                      <input
                        className={styles.input}
                        value={block.content.url}
                        onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
                        placeholder="Image URL"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <input
                        className={styles.input}
                        value={block.content.alt}
                        onChange={(e) => updateBlock(block.id, { ...block.content, alt: e.target.value })}
                        placeholder="Alt text"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <input
                        className={styles.input}
                        value={block.content.caption}
                        onChange={(e) => updateBlock(block.id, { ...block.content, caption: e.target.value })}
                        placeholder="Caption (optional)"
                      />
                    </>
                  )}

                  {block.type === 'form' && (
                    <select
                      className={styles.input}
                      value={block.content.formId}
                      onChange={(e) => updateBlock(block.id, { ...block.content, formId: e.target.value })}
                    >
                      <option value="">Select a form...</option>
                      {forms.map(form => (
                        <option key={form.id} value={form.id}>{form.name}</option>
                      ))}
                    </select>
                  )}

                  {block.type === 'cta' && (
                    <>
                      <input
                        className={styles.input}
                        value={block.content.text}
                        onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                        placeholder="CTA text"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          className={styles.input}
                          value={block.content.buttonText}
                          onChange={(e) => updateBlock(block.id, { ...block.content, buttonText: e.target.value })}
                          placeholder="Button Text"
                        />
                        <input
                          className={styles.input}
                          value={block.content.buttonUrl}
                          onChange={(e) => updateBlock(block.id, { ...block.content, buttonUrl: e.target.value })}
                          placeholder="Button URL"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}

              {formData.content.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📄</div>
                  <div>No content blocks yet. Click "Add Block" to start building your page.</div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Actions</h2>
              <button
                className={styles.primaryButton}
                onClick={handleSave}
                disabled={saving}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                {saving ? 'Saving...' : 'Save Page'}
              </button>

              {!isNew && (
                <>
                  <button
                    className={styles.secondaryButton}
                    onClick={handlePreview}
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                  >
                    Preview
                  </button>

                  <button
                    className={formData.status === 'published' ? styles.secondaryButton : styles.primaryButton}
                    onClick={handlePublish}
                    style={{ width: '100%' }}
                  >
                    {formData.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                </>
              )}
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Status</h2>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <p><strong>Current Status:</strong> {formData.status}</p>
                <p><strong>Template:</strong> {formData.template}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}
