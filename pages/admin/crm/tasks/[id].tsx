import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/DepartmentLayout';
import { Department } from '../../../../lib/departments';
import styles from './Tasks.module.css';

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Deal {
  id: string;
  name: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'todo',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    dueTime: '',
    contactId: '',
    dealId: '',
  });

  useEffect(() => {
    fetchContacts();
    fetchDeals();
    if (!isNew && id) {
      fetchTask();
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/admin/crm/tasks/${id}`);
      const data = await res.json();
      setFormData({
        title: data.title,
        description: data.description || '',
        type: data.type,
        priority: data.priority,
        status: data.status,
        dueDate: data.due_date || '',
        dueTime: data.due_time || '',
        contactId: data.contact_id || '',
        dealId: data.deal_id || '',
      });
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/admin/crm/contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/admin/crm/deals');
      const data = await res.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Please enter a task title');
      return;
    }

    setSaving(true);

    try {
      const url = isNew ? '/api/admin/crm/tasks' : `/api/admin/crm/tasks/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          router.push('/admin/crm/tasks');
        } else {
          alert('Task saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this task as completed?')) return;

    try {
      await fetch(`/api/admin/crm/tasks/${id}/complete`, {
        method: 'POST',
      });
      router.push('/admin/crm/tasks');
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task? This action cannot be undone.')) return;

    try {
      await fetch(`/api/admin/crm/tasks/${id}`, {
        method: 'DELETE',
      });
      router.push('/admin/crm/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return (
      <DepartmentLayout department={Department.CUSTOMER_SERVICE}>
        <div className={styles.loading}>Loading task...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout department={Department.CUSTOMER_SERVICE}>
      <div className={styles.detailContainer}>
        <a href="/admin/crm/tasks" className={styles.backLink}>
          ← Back to Tasks
        </a>

        <div className={styles.header}>
          <h1 className={styles.title}>{isNew ? 'New Task' : 'Edit Task'}</h1>
        </div>

        <div className={styles.detailLayout}>
          <div className={styles.mainColumn}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Task Details</h2>

              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Follow up with John about proposal"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  className={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add details about this task..."
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select
                    className={styles.select}
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="todo">To-Do</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <select
                    className={styles.select}
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Due Date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Due Time</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={formData.dueTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Related To</h2>

              <div className={styles.formGroup}>
                <label>Contact</label>
                <select
                  className={styles.select}
                  value={formData.contactId}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactId: e.target.value }))}
                >
                  <option value="">None</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} ({contact.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Deal</label>
                <select
                  className={styles.select}
                  value={formData.dealId}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealId: e.target.value }))}
                >
                  <option value="">None</option>
                  {deals.map(deal => (
                    <option key={deal.id} value={deal.id}>
                      {deal.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Actions</h2>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Task'}
              </button>

              {!isNew && formData.status === 'pending' && (
                <div className={styles.statusButtons} style={{ marginTop: '1rem' }}>
                  <button
                    className={`${styles.statusButton} ${styles.completeButton}`}
                    onClick={handleComplete}
                  >
                    Mark as Completed
                  </button>
                </div>
              )}

              {!isNew && (
                <button className={styles.deleteButton} onClick={handleDelete}>
                  Delete Task
                </button>
              )}
            </div>

            {!isNew && formData.status === 'completed' && (
              <div className={styles.section}>
                <div
                  style={{
                    padding: '1rem',
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  ✓ Task Completed
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}
