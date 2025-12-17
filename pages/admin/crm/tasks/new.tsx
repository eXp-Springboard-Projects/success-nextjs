import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import styles from '../../editorial/Editorial.module.css';

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

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'todo',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    contactId: '',
    dealId: '',
    reminderAt: '',
  });

  useEffect(() => {
    fetchContacts();
    fetchDeals();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/admin/crm/contacts?limit=100');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/admin/crm/deals?limit=100');
      const data = await res.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      alert('Please enter a task title');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
          dueTime: formData.dueTime || null,
          contactId: formData.contactId || null,
          dealId: formData.dealId || null,
          reminderAt: formData.reminderAt || null,
        }),
      });

      if (res.ok) {
        router.push('/admin/crm/tasks');
      } else {
        alert('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="New Task">
      <div className={styles.container}>
        <a href="/admin/crm/tasks" className={styles.backLink}>
          ← Back to Tasks
        </a>

        <div className={styles.header}>
          <h1>New Task</h1>
        </div>

        <div className={styles.section}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Follow up with John about proposal"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                className={styles.textarea}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add details about this task..."
                rows={4}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Type</label>
                <select
                  className={styles.input}
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="call">📞 Call</option>
                  <option value="email">📧 Email</option>
                  <option value="meeting">📅 Meeting</option>
                  <option value="todo">✓ To-Do</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Priority</label>
                <select
                  className={styles.input}
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="urgent">Urgent</option>
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

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Related Contact</label>
                <select
                  className={styles.input}
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
                <label>Related Deal</label>
                <select
                  className={styles.input}
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

            <div className={styles.formGroup}>
              <label>Reminder</label>
              <input
                type="datetime-local"
                className={styles.input}
                value={formData.reminderAt}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderAt: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                className={styles.primaryButton}
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/crm/tasks')}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DepartmentLayout>
  );
}
