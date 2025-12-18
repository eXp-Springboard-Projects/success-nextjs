import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './CRM.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type Contact = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  tags: string[];
  status: string;
  source?: string;
  createdAt: string;
};

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [newContact, setNewContact] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    tags: '',
    source: 'manual'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchContacts();
    }
  }, [session]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/crm/contacts');
      const data = await res.json();
      setContacts(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.email) {
      alert('Email is required');
      return;
    }

    try {
      const tags = newContact.tags.split(',').map(t => t.trim()).filter(Boolean);

      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newContact,
          tags
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewContact({
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          company: '',
          tags: '',
          source: 'manual'
        });
        fetchContacts();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to add contact');
      }
    } catch (error) {
      alert('Failed to add contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const res = await fetch(`/api/crm/contacts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchContacts();
      }
    } catch (error) {
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchQuery === '' ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || contact.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading contacts...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>CRM Contacts</h1>
          <button onClick={() => setShowAddModal(true)} className={styles.addButton}>
            ➕ Add Contact
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{contacts.length}</div>
            <div className={styles.statLabel}>Total Contacts</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {contacts.filter(c => c.status === 'ACTIVE').length}
            </div>
            <div className={styles.statLabel}>Active</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {contacts.filter(c => c.status === 'UNSUBSCRIBED').length}
            </div>
            <div className={styles.statLabel}>Unsubscribed</div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
            <option value="BOUNCED">Bounced</option>
            <option value="SPAM">Spam</option>
          </select>
        </div>

        {/* Contacts Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Source</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    No contacts found
                  </td>
                </tr>
              ) : (
                filteredContacts.map(contact => (
                  <tr key={contact.id}>
                    <td>
                      {contact.firstName || contact.lastName
                        ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                        : '-'}
                    </td>
                    <td>{contact.email}</td>
                    <td>{contact.phone || '-'}</td>
                    <td>{contact.company || '-'}</td>
                    <td>
                      {contact.tags.length > 0 ? (
                        <div className={styles.tags}>
                          {contact.tags.map((tag, i) => (
                            <span key={i} className={styles.tag}>{tag}</span>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`${styles.status} ${styles[`status${contact.status}`]}`}>
                        {contact.status}
                      </span>
                    </td>
                    <td>{contact.source || '-'}</td>
                    <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className={styles.deleteButton}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Contact Modal */}
        {showAddModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Add New Contact</h2>
                <button onClick={() => setShowAddModal(false)} className={styles.closeButton}>
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>First Name</label>
                    <input
                      type="text"
                      value={newContact.firstName}
                      onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={newContact.lastName}
                      onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Company</label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newContact.tags}
                    onChange={(e) => setNewContact({...newContact, tags: e.target.value})}
                    className={styles.input}
                    placeholder="subscriber, customer, vip"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Source</label>
                  <select
                    value={newContact.source}
                    onChange={(e) => setNewContact({...newContact, source: e.target.value})}
                    className={styles.input}
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="website">Website Form</option>
                    <option value="import">Import</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={() => setShowAddModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleAddContact} className={styles.saveButton}>
                  Add Contact
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
