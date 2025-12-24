import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Tickets.module.css';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    contactId: '',
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/admin/crm/contacts?limit=100');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/crm/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const ticket = await res.json();
        router.push(`/admin/crm/tickets/${ticket.id}`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create ticket');
      }
    } catch (error) {
      alert('Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getContactName = (contact: Contact) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    return contact.email;
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="New Ticket"
      description="Create a new support ticket"
    >
      <div className={styles.dashboard}>
        <Link href="/admin/crm/tickets" className={styles.backLink}>
          ← Back to Tickets
        </Link>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>New Support Ticket</h1>
            <p className={styles.pageDescription}>Create a new customer support ticket</p>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', maxWidth: '800px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Contact Selection */}
              <div>
                <label
                  htmlFor="contactId"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Contact (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                  }}
                />
                <select
                  id="contactId"
                  value={formData.contactId}
                  onChange={(e) => handleChange('contactId', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">-- No contact --</option>
                  {filteredContacts.slice(0, 50).map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {getContactName(contact)} ({contact.email})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Link this ticket to an existing contact, or leave blank for general ticket
                </small>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  required
                  placeholder="Brief summary of the issue"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  required
                  rows={6}
                  placeholder="Detailed description of the issue or request..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Priority and Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    htmlFor="priority"
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="category"
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="account">Account</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: saving ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Creating...' : 'Create Ticket'}
                </button>
                <Link
                  href="/admin/crm/tickets"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth;
