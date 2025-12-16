import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from './Forms.module.css';

interface Field {
  id: string;
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: string;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Text Input' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone' },
  { type: 'textarea', label: 'Text Area' },
  { type: 'select', label: 'Dropdown' },
  { type: 'radio', label: 'Radio Buttons' },
  { type: 'checkbox', label: 'Checkboxes' },
  { type: 'number', label: 'Number' },
  { type: 'date', label: 'Date' },
];

export default function FormBuilder() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'settings' | 'embed'>('fields');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [fields, setFields] = useState<Field[]>([]);
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [listId, setListId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notifyEmails, setNotifyEmails] = useState<string[]>([]);

  const [lists, setLists] = useState<any[]>([]);

  useEffect(() => {
    if (!isNew && id) {
      fetchForm();
    }
    fetchLists();
  }, [id, isNew]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/admin/crm/forms/${id}`);
      const data = await res.json();

      setFormName(data.name);
      setFormStatus(data.status);
      setFields(data.fields || []);
      setThankYouMessage(data.thankYouMessage || '');
      setRedirectUrl(data.redirectUrl || '');
      setListId(data.listId || '');
      setTags(data.tags || []);
      setNotifyEmails(data.notifyEmails || []);
    } catch (error) {
      console.error('Error fetching form:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/admin/crm/lists?type=STATIC');
      const data = await res.json();
      setLists(data.lists || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const addField = (type: string) => {
    const newField: Field = {
      id: `field_${Date.now()}`,
      type,
      name: `field_${fields.length + 1}`,
      label: `New ${type} Field`,
      required: false,
      ...(type === 'select' || type === 'radio' || type === 'checkbox' ? { options: ['Option 1', 'Option 2'] } : {}),
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const saveForm = async () => {
    if (!formName.trim()) {
      alert('Please enter a form name');
      return;
    }

    setSaving(true);

    try {
      const data = {
        name: formName,
        fields,
        settings: {},
        thankYouMessage,
        redirectUrl,
        listId: listId || null,
        tags,
        notifyEmails,
        status: formStatus,
      };

      const url = isNew ? '/api/admin/crm/forms' : `/api/admin/crm/forms/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const savedForm = await res.json();
        if (isNew) {
          router.push(`/admin/crm/forms/${savedForm.id}`);
        } else {
          alert('Form saved successfully');
        }
      } else {
        alert('Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form');
    } finally {
      setSaving(false);
    }
  };

  const selectedField = selectedFieldId ? fields.find(f => f.id === selectedFieldId) : null;

  const embedCode = `<div id="success-form-${id}"></div>
<script src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.success.com'}/embed/form.js"></script>
<script>
  SuccessForm.embed('${id}', 'success-form-${id}');
</script>`;

  if (loading) {
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
            <h1>{isNew ? 'Create Form' : 'Edit Form'}</h1>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Form Name"
              className={styles.formNameInput}
              style={{ fontSize: '1.2rem', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <button
              className={styles.buttonSecondary}
              onClick={() => router.push('/admin/crm/forms')}
            >
              Cancel
            </button>
            <button
              className={styles.buttonPrimary}
              onClick={saveForm}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'fields' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('fields')}
          >
            Fields
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'embed' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('embed')}
            disabled={isNew}
          >
            Embed Code
          </button>
        </div>

        {activeTab === 'fields' && (
          <div className={styles.builderContainer}>
            {/* Left Sidebar - Field Types */}
            <div className={styles.sidebar}>
              <h3>Add Field</h3>
              <div className={styles.fieldTypes}>
                {FIELD_TYPES.map((fieldType) => (
                  <button
                    key={fieldType.type}
                    className={styles.fieldType}
                    onClick={() => addField(fieldType.type)}
                  >
                    + {fieldType.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Center Canvas - Form Preview */}
            <div className={styles.canvas}>
              {fields.length === 0 ? (
                <div className={styles.canvasEmpty}>
                  <div>
                    <p>No fields yet</p>
                    <p style={{ fontSize: '0.9rem', color: '#999' }}>Add fields from the left sidebar</p>
                  </div>
                </div>
              ) : (
                fields.map((field) => (
                  <div
                    key={field.id}
                    className={`${styles.formField} ${selectedFieldId === field.id ? styles.formFieldActive : ''}`}
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    <div className={styles.fieldHeader}>
                      <div>
                        <div className={styles.fieldLabel}>
                          {field.label}
                          {field.required && <span className={styles.fieldRequired}> *</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#999' }}>{field.type}</div>
                      </div>
                      <div className={styles.fieldActions}>
                        <button
                          className={styles.fieldActionBtn}
                          onClick={(e) => { e.stopPropagation(); moveField(field.id, 'up'); }}
                          disabled={fields.indexOf(field) === 0}
                        >
                          ↑
                        </button>
                        <button
                          className={styles.fieldActionBtn}
                          onClick={(e) => { e.stopPropagation(); moveField(field.id, 'down'); }}
                          disabled={fields.indexOf(field) === fields.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          className={styles.fieldActionBtn}
                          onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Field Preview */}
                    {field.type === 'textarea' ? (
                      <textarea placeholder={field.placeholder} disabled style={{ width: '100%', padding: '0.5rem' }} />
                    ) : field.type === 'select' ? (
                      <select disabled style={{ width: '100%', padding: '0.5rem' }}>
                        <option>Select...</option>
                        {field.options?.map((opt, i) => <option key={i}>{opt}</option>)}
                      </select>
                    ) : field.type === 'radio' || field.type === 'checkbox' ? (
                      <div>
                        {field.options?.map((opt, i) => (
                          <div key={i} style={{ marginBottom: '0.5rem' }}>
                            <input type={field.type} disabled /> <label>{opt}</label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <input type={field.type} placeholder={field.placeholder} disabled style={{ width: '100%', padding: '0.5rem' }} />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Right Sidebar - Field Properties */}
            <div className={styles.properties}>
              {selectedField ? (
                <>
                  <h3>Field Properties</h3>
                  <div className={styles.formGroup}>
                    <label>Field Label</label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Field Name</label>
                    <input
                      type="text"
                      value={selectedField.name}
                      onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Placeholder</label>
                    <input
                      type="text"
                      value={selectedField.placeholder || ''}
                      onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={selectedField.required}
                        onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                      />
                      Required Field
                    </label>
                  </div>
                  {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                    <div className={styles.formGroup}>
                      <label>Options (one per line)</label>
                      <textarea
                        value={selectedField.options?.join('\n') || ''}
                        onChange={(e) => updateField(selectedField.id, { options: e.target.value.split('\n').filter(Boolean) })}
                        rows={5}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                  Select a field to edit its properties
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '800px' }}>
            <div className={styles.formGroup}>
              <label>Thank You Message</label>
              <textarea
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                placeholder="Thank you for your submission!"
                rows={4}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Redirect URL (Optional)</label>
              <input
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://example.com/thank-you"
              />
              <small style={{ color: '#666', fontSize: '0.85rem' }}>Redirect to this URL after submission instead of showing thank you message</small>
            </div>
            <div className={styles.formGroup}>
              <label>Add to List</label>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                <option value="">None</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Tags (comma separated)</label>
              <input
                type="text"
                value={tags.join(', ')}
                onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="lead, webinar, download"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Notification Emails (comma separated)</label>
              <input
                type="text"
                value={notifyEmails.join(', ')}
                onChange={(e) => setNotifyEmails(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="admin@example.com, sales@example.com"
              />
            </div>
          </div>
        )}

        {activeTab === 'embed' && (
          <div style={{ maxWidth: '800px' }}>
            <h3>Embed Code</h3>
            <p>Copy and paste this code into your website to embed this form:</p>
            <div className={styles.embedCode}>
              <code>{embedCode}</code>
            </div>
            <button
              className={styles.copyButton}
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                alert('Embed code copied to clipboard!');
              }}
            >
              Copy to Clipboard
            </button>

            <div style={{ marginTop: '2rem' }}>
              <h3>Direct Link</h3>
              <p>Or share this direct link:</p>
              <div className={styles.embedCode}>
                <code>{`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.success.com'}/forms/${id}`}</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
