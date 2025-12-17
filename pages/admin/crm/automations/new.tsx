import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from '../../editorial/Editorial.module.css';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface ContactList {
  id: string;
  name: string;
}

export default function NewAutomationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    trigger: 'contact_created',
    conditions: [] as Array<{ field: string; operator: string; value: string }>,
    actions: [] as Array<{ type: string; templateId?: string; delay?: number; listId?: string; tagName?: string }>,
    status: 'active',
  });

  useEffect(() => {
    fetchTemplates();
    fetchLists();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/crm/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/admin/crm/lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists || []);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { field: 'leadScore', operator: 'greater_than', value: '' },
      ],
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, field: string, value: string) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const addAction = (type: string) => {
    const newAction: any = { type };
    if (type === 'send_email') {
      newAction.templateId = templates[0]?.id || '';
      newAction.delay = 0;
    } else if (type === 'add_to_list') {
      newAction.listId = lists[0]?.id || '';
    }
    setFormData({
      ...formData,
      actions: [...formData.actions, newAction],
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.actions.length === 0) {
      alert('Please provide a name and at least one action');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin/crm/automations');
      } else {
        alert('Failed to create automation');
      }
    } catch (error) {
      console.error('Error creating automation:', error);
      alert('Failed to create automation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Create Automation">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Create Email Automation</h1>
            <p>Build automated workflows to engage your contacts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Automation Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  placeholder="e.g., Welcome New Subscribers"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Trigger Event *</label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className={styles.input}
                  required
                >
                  <option value="contact_created">Contact Created</option>
                  <option value="list_joined">Joined List</option>
                  <option value="form_submitted">Form Submitted</option>
                  <option value="email_opened">Email Opened</option>
                  <option value="email_clicked">Email Link Clicked</option>
                  <option value="tag_added">Tag Added</option>
                  <option value="lead_score_reached">Lead Score Reached</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Conditions (Optional)</h2>
              <button
                type="button"
                onClick={addCondition}
                className={styles.secondaryButton}
              >
                + Add Condition
              </button>
            </div>
            {formData.conditions.length === 0 ? (
              <div className={styles.infoBox}>
                No conditions set. Automation will run for all matching triggers.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.conditions.map((condition, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Field</label>
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        className={styles.input}
                      >
                        <option value="leadScore">Lead Score</option>
                        <option value="status">Status</option>
                        <option value="source">Source</option>
                        <option value="company">Company</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Operator</label>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className={styles.input}
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="contains">Contains</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Value</label>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        className={styles.input}
                        placeholder="Enter value"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className={styles.dangerButton}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Actions *</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => addAction('send_email')}
                  className={styles.secondaryButton}
                >
                  + Send Email
                </button>
                <button
                  type="button"
                  onClick={() => addAction('add_to_list')}
                  className={styles.secondaryButton}
                >
                  + Add to List
                </button>
                <button
                  type="button"
                  onClick={() => addAction('add_tag')}
                  className={styles.secondaryButton}
                >
                  + Add Tag
                </button>
              </div>
            </div>

            {formData.actions.length === 0 ? (
              <div className={styles.infoBox}>
                Add at least one action to perform when this automation triggers.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.actions.map((action, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '1.5rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      background: '#f9fafb',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        Action {index + 1}: {action.type.replace('_', ' ').toUpperCase()}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        className={styles.dangerButton}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        Remove
                      </button>
                    </div>

                    {action.type === 'send_email' && (
                      <>
                        <div className={styles.formGroup}>
                          <label>Delay (minutes)</label>
                          <input
                            type="number"
                            value={action.delay || 0}
                            onChange={(e) => updateAction(index, 'delay', parseInt(e.target.value))}
                            className={styles.input}
                            min="0"
                            placeholder="0 = Send immediately"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Email Template</label>
                          <select
                            value={action.templateId || ''}
                            onChange={(e) => updateAction(index, 'templateId', e.target.value)}
                            className={styles.input}
                            required
                          >
                            <option value="">Select template...</option>
                            {templates.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} - {t.subject}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {action.type === 'add_to_list' && (
                      <div className={styles.formGroup}>
                        <label>Contact List</label>
                        <select
                          value={action.listId || ''}
                          onChange={(e) => updateAction(index, 'listId', e.target.value)}
                          className={styles.input}
                          required
                        >
                          <option value="">Select list...</option>
                          {lists.map(l => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {action.type === 'add_tag' && (
                      <div className={styles.formGroup}>
                        <label>Tag Name</label>
                        <input
                          type="text"
                          value={action.tagName || ''}
                          onChange={(e) => updateAction(index, 'tagName', e.target.value)}
                          className={styles.input}
                          placeholder="e.g., vip, newsletter-subscriber"
                          required
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'paused' })}
                  style={{ width: 'auto' }}
                />
                Activate automation immediately
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.push('/admin/crm/automations')}
              className={styles.secondaryButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Automation'}
            </button>
          </div>
        </form>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
