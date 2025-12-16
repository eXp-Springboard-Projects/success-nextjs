import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Contacts.module.css';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  email_status: string;
  tags: string[];
  lists: string[];
  last_activity: string | null;
  created_at: string;
  total_emails_sent: number;
  total_opens: number;
  total_clicks: number;
}

export default function ContactsListPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchContacts();
  }, [searchTerm, statusFilter, page]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/crm/contacts?${params}`);
      const data = await res.json();

      setContacts(data.contacts || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectContact = (id: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
      setShowBulkActions(true);
    }
  };

  const handleExport = async () => {
    const ids = Array.from(selectedContacts).join(',');
    window.open(`/api/admin/crm/contacts/export?format=csv${ids ? `&ids=${ids}` : ''}`, '_blank');
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedContacts.size} contacts? This action cannot be undone.`)) {
      return;
    }

    for (const id of selectedContacts) {
      await fetch(`/api/admin/crm/contacts/${id}`, { method: 'DELETE' });
    }

    setSelectedContacts(new Set());
    setShowBulkActions(false);
    fetchContacts();
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="CRM Contacts"
      description="Manage your contact database"
    >
      <div className={styles.dashboard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Contacts</h1>
            <p className={styles.pageDescription}>Manage your contact database</p>
          </div>
          <div className={styles.headerRight}>
            <Link href="/admin/crm/contacts/new" className={styles.primaryButton}>
              + Add Contact
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className={styles.bulkActionsBar}>
            <span className={styles.bulkActionsText}>
              {selectedContacts.size} selected
            </span>
            <div className={styles.bulkActionsButtons}>
              <button onClick={handleExport} className={styles.bulkActionButton}>
                Export
              </button>
              <button onClick={handleBulkDelete} className={styles.bulkActionButtonDanger}>
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👤</div>
              <h3>No contacts found</h3>
              <p>Start by adding your first contact</p>
              <Link href="/admin/crm/contacts/new" className={styles.primaryButton}>
                + Add Contact
              </Link>
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedContacts.size === contacts.length && contacts.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Tags</th>
                    <th>Lists</th>
                    <th>Status</th>
                    <th>Email Stats</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => toggleSelectContact(contact.id)}
                        />
                      </td>
                      <td>
                        <Link href={`/admin/crm/contacts/${contact.id}`} className={styles.contactName}>
                          {contact.first_name || contact.last_name
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            : 'No Name'}
                        </Link>
                      </td>
                      <td>{contact.email}</td>
                      <td>{contact.company || '-'}</td>
                      <td>
                        <div className={styles.tags}>
                          {contact.tags && contact.tags.length > 0 ? (
                            contact.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className={styles.tag}>{tag}</span>
                            ))
                          ) : '-'}
                          {contact.tags && contact.tags.length > 2 && (
                            <span className={styles.tagMore}>+{contact.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {contact.lists && contact.lists.length > 0
                          ? contact.lists.slice(0, 2).join(', ')
                          : '-'}
                        {contact.lists && contact.lists.length > 2 && ` +${contact.lists.length - 2}`}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${contact.status}`]}`}>
                          {contact.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.emailStats}>
                          <span title="Sent">{contact.total_emails_sent || 0}📤</span>
                          <span title="Opens">{contact.total_opens || 0}👁️</span>
                          <span title="Clicks">{contact.total_clicks || 0}🖱️</span>
                        </div>
                      </td>
                      <td>
                        {contact.last_activity
                          ? new Date(contact.last_activity).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td>
                        <Link href={`/admin/crm/contacts/${contact.id}`} className={styles.actionButton}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={styles.paginationButton}
                  >
                    Previous
                  </button>
                  <span className={styles.paginationInfo}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={styles.paginationButton}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
