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
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<EditorialItem | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    contentType: 'ARTICLE',
    status: 'DRAFT',
    priority: 'MEDIUM',
    scheduledDate: '',
    deadline: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEditorialItems();
    }
  }, [status, session, statusFilter]);

  const fetchEditorialItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/editorial-calendar?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
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
          status: 'DRAFT',
          priority: 'MEDIUM',
          scheduledDate: '',
          deadline: '',
          notes: '',
        });
        fetchEditorialItems();
      }
    } catch (error) {
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/editorial-calendar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchEditorialItems();
      }
    } catch (error) {
    }
  };

  const handleUpdateDate = async (id: string, scheduledDate: string) => {
    try {
      const res = await fetch(`/api/editorial-calendar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate }),
      });

      if (res.ok) {
        fetchEditorialItems();
      }
    } catch (error) {
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      DRAFT: '#9ca3af',        // Gray
      IN_REVIEW: '#fbbf24',    // Yellow
      APPROVED: '#3b82f6',     // Blue
      SCHEDULED: '#8b5cf6',    // Purple
      PUBLISHED: '#10b981',    // Green
    };
    return colors[status] || '#9ca3af';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      DRAFT: 'Draft',
      IN_REVIEW: 'In Review',
      APPROVED: 'Approved',
      SCHEDULED: 'Scheduled',
      PUBLISHED: 'Published',
    };
    return labels[status] || status;
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: EditorialItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    if (draggedItem) {
      handleUpdateDate(draggedItem.id, targetDate);
      setDraggedItem(null);
    }
  };

  if (status === 'loading' || loading) {
    return <AdminLayout><div className={styles.loading}>Loading...</div></AdminLayout>;
  }

  if (!session) {
    return null;
  }

  const statusFilters = ['all', 'DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'];
  const filteredItems = statusFilter === 'all'
    ? items
    : items.filter(item => item.status === statusFilter);

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

        {/* Status Filter Pills */}
        <div className={styles.filterContainer}>
          <div className={styles.filterLabel}>Filter by Status:</div>
          <div className={styles.filters}>
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={statusFilter === f ? styles.filterActive : styles.filterButton}
                style={{
                  backgroundColor: statusFilter === f
                    ? (f === 'all' ? '#111' : getStatusColor(f))
                    : 'transparent',
                  borderColor: f === 'all' ? '#111' : getStatusColor(f),
                  color: statusFilter === f ? 'white' : (f === 'all' ? '#111' : getStatusColor(f))
                }}
              >
                {f === 'all' ? 'All' : getStatusLabel(f)}
                {f !== 'all' && ` (${items.filter(i => i.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon} style={{ backgroundColor: '#f3f4f6' }}>📝</div>
            <div>
              <h3>Total Items</h3>
              <p className={styles.summaryValue}>{items.length}</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon} style={{ backgroundColor: '#fef3c7' }}>🔍</div>
            <div>
              <h3>In Review</h3>
              <p className={styles.summaryValue} style={{ color: '#fbbf24' }}>
                {items.filter(i => i.status === 'IN_REVIEW').length}
              </p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon} style={{ backgroundColor: '#ede9fe' }}>📅</div>
            <div>
              <h3>Scheduled</h3>
              <p className={styles.summaryValue} style={{ color: '#8b5cf6' }}>
                {items.filter(i => i.status === 'SCHEDULED').length}
              </p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon} style={{ backgroundColor: '#d1fae5' }}>✅</div>
            <div>
              <h3>Published</h3>
              <p className={styles.summaryValue} style={{ color: '#10b981' }}>
                {items.filter(i => i.status === 'PUBLISHED').length}
              </p>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className={styles.legend}>
          <div className={styles.legendTitle}>Status Colors:</div>
          <div className={styles.legendItems}>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#9ca3af' }}></div>
              <span>Draft</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#fbbf24' }}></div>
              <span>In Review</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }}></div>
              <span>Approved</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#8b5cf6' }}></div>
              <span>Scheduled</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#10b981' }}></div>
              <span>Published</span>
            </div>
          </div>
        </div>

        {/* Drag & Drop Hint */}
        <div className={styles.dragHint}>
          💡 Tip: Drag items to different dates to reschedule them
        </div>

        {/* Content Items Table */}
        {filteredItems.length === 0 ? (
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
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={styles.draggableRow}
                  >
                    <td className={styles.titleCell}>
                      <div className={styles.dragHandle}>⋮⋮</div>
                      <div>
                        <strong>{item.title}</strong>
                        {item.notes && <span className={styles.notes}>{item.notes}</span>}
                      </div>
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
                        style={{
                          backgroundColor: getStatusColor(item.status),
                          color: 'white',
                          fontWeight: '600'
                        }}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="PUBLISHED">Published</option>
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
                      <input
                        type="date"
                        value={item.scheduledDate ? item.scheduledDate.split('T')[0] : ''}
                        onChange={(e) => handleUpdateDate(item.id, e.target.value)}
                        className={styles.dateInput}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, e.currentTarget.value)}
                      />
                    </td>
                    <td className={styles.actions}>
                      <button className={styles.actionButton}>Edit</button>
                      <button className={styles.actionButtonDanger}>Delete</button>
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

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
