import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './EditorialCalendar.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface EditorialItem {
  id: string;
  title: string;
  contentType: 'ARTICLE' | 'VIDEO' | 'PODCAST' | 'MAGAZINE' | 'PAGE' | 'NEWSLETTER';
  status: 'IDEA' | 'ASSIGNED' | 'IN_PROGRESS' | 'DRAFT' | 'IN_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  assignedTo?: {
    name: string;
    email: string;
  };
  scheduledDate?: string;
  publishDate?: string;
  deadline?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditorialCalendar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<EditorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    contentType: 'ARTICLE',
    status: 'IDEA',
    priority: 'MEDIUM',
    scheduledDate: '',
    deadline: '',
    notes: '',
  });

  useEffect(() => {
    // Auth is handled by requireAdminAuth in getServerSideProps
    // No client-side redirects needed
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchEditorialItems();
    }
  }, [status, session, filter]);

  const fetchEditorialItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/editorial-calendar?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching editorial items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const res = await fetch('/api/editorial-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewItem({
          title: '',
          contentType: 'ARTICLE',
          status: 'IDEA',
          priority: 'MEDIUM',
          scheduledDate: '',
          deadline: '',
          notes: '',
        });
        fetchEditorialItems();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/editorial-calendar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchEditorialItems();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      IDEA: '#9ca3af',
      ASSIGNED: '#3b82f6',
      IN_PROGRESS: '#f59e0b',
      DRAFT: '#8b5cf6',
      IN_REVIEW: '#ec4899',
      SCHEDULED: '#10b981',
      PUBLISHED: '#059669',
      ARCHIVED: '#6b7280',
    };
    return colors[status] || '#666';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      LOW: '#10b981',
      MEDIUM: '#3b82f6',
      HIGH: '#f59e0b',
      URGENT: '#ef4444',
    };
    return colors[priority] || '#666';
  };

  if (status === 'loading' || loading) {
    return <AdminLayout><div className={styles.loading}>Loading...</div></AdminLayout>;
  }

  if (!session) {
    return null;
  }

  const statusFilters = ['all', 'IDEA', 'ASSIGNED', 'IN_PROGRESS', 'DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED'];

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Editorial Calendar</h1>
            <p className={styles.subtitle}>Plan and manage your content production pipeline</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className={styles.addButton}>
            + New Content Item
          </button>
        </div>

        {/* Filter Buttons */}
        <div className={styles.filters}>
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? styles.filterActive : styles.filterButton}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
              {f !== 'all' && ` (${items.filter(i => i.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h3>Total Items</h3>
            <p className={styles.summaryValue}>{items.length}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>In Progress</h3>
            <p className={styles.summaryValue} style={{ color: '#f59e0b' }}>
              {items.filter(i => i.status === 'IN_PROGRESS').length}
            </p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Scheduled</h3>
            <p className={styles.summaryValue} style={{ color: '#10b981' }}>
              {items.filter(i => i.status === 'SCHEDULED').length}
            </p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Urgent</h3>
            <p className={styles.summaryValue} style={{ color: '#ef4444' }}>
              {items.filter(i => i.priority === 'URGENT').length}
            </p>
          </div>
        </div>

        {/* Content Items Table */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>No editorial items found. Start planning your content!</p>
            <button onClick={() => setShowAddModal(true)} className={styles.addButton}>
              + Add First Item
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Deadline</th>
                  <th>Scheduled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.titleCell}>
                      <strong>{item.title}</strong>
                      {item.notes && <span className={styles.notes}>{item.notes}</span>}
                    </td>
                    <td>
                      <span className={styles.badge} style={{ backgroundColor: '#667eea' }}>
                        {item.contentType}
                      </span>
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className={styles.statusSelect}
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      >
                        <option value="IDEA">Idea</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DRAFT">Draft</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </td>
                    <td>
                      <span
                        className={styles.priorityBadge}
                        style={{ backgroundColor: getPriorityColor(item.priority) }}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td>{item.assignedTo?.name || 'Unassigned'}</td>
                    <td>
                      {item.deadline
                        ? new Date(item.deadline).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      {item.scheduledDate
                        ? new Date(item.scheduledDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className={styles.actions}>
                      <button className={styles.actionButton}>Edit</button>
                      <button className={styles.actionButton}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <div className={styles.modal} onClick={() => setShowAddModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Add New Content Item</h2>

              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Article title or content name"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Content Type</label>
                  <select
                    value={newItem.contentType}
                    onChange={(e) => setNewItem({ ...newItem, contentType: e.target.value })}
                  >
                    <option value="ARTICLE">Article</option>
                    <option value="VIDEO">Video</option>
                    <option value="PODCAST">Podcast</option>
                    <option value="MAGAZINE">Magazine</option>
                    <option value="PAGE">Page</option>
                    <option value="NEWSLETTER">Newsletter</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={newItem.deadline}
                    onChange={(e) => setNewItem({ ...newItem, deadline: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    value={newItem.scheduledDate}
                    onChange={(e) => setNewItem({ ...newItem, scheduledDate: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Additional notes about this content..."
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <button onClick={() => setShowAddModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleAddItem} className={styles.saveButton}>
                  Add Item
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
