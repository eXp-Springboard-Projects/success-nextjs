import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from '../../crm/contacts/Contacts.module.css';

interface SocialMediaRequest {
  id: string;
  title: string;
  description: string | null;
  link_url: string | null;
  image_url: string | null;
  status: string;
  priority: string;
  requested_by: string;
  requested_by_name: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export default function SocialMediaRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SocialMediaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingRequest, setEditingRequest] = useState<SocialMediaRequest | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/social-media/requests?${params}`);
      const data = await res.json();

      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/social-media/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchRequests();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Delete this request? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/social-media/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchRequests();
      } else {
        alert('Failed to delete request');
      }
    } catch (error) {
      alert('Failed to delete request');
    }
  };

  const handleEditClick = (request: SocialMediaRequest) => {
    setEditingRequest(request);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    try {
      const res = await fetch(`/api/admin/social-media/requests/${editingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingRequest.title,
          description: editingRequest.description,
          linkUrl: editingRequest.link_url,
          imageUrl: editingRequest.image_url,
          status: editingRequest.status,
          priority: editingRequest.priority,
          notes: editingRequest.notes,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingRequest(null);
        fetchRequests();
      } else {
        alert('Failed to save changes');
      }
    } catch (error) {
      alert('Failed to save changes');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: '#ffc107',
      in_progress: '#17a2b8',
      completed: '#28a745',
      cancelled: '#6c757d',
    };

    return (
      <span style={{
        background: statusColors[status] || '#6c757d',
        color: '#fff',
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      low: '#17a2b8',
      medium: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545',
    };

    return (
      <span style={{
        background: priorityColors[priority] || '#6c757d',
        color: '#fff',
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        {priority}
      </span>
    );
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="Social Media Requests"
      description="Manage social media content requests"
    >
      <div className={styles.dashboard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Social Media Requests</h1>
            <p className={styles.pageDescription}>Submit and manage social media content requests</p>
          </div>
          <div className={styles.headerRight}>
            <Link href="/admin/social-media/requests/new" className={styles.primaryButton}>
              + New Request
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && editingRequest && (
          <div className={styles.modal} onClick={() => setShowEditModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>Edit Request</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={styles.modalClose}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className={styles.label}>Title:</label>
                  <input
                    type="text"
                    value={editingRequest.title}
                    onChange={(e) => setEditingRequest({ ...editingRequest, title: e.target.value })}
                    className={styles.searchInput}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className={styles.label}>Description:</label>
                  <textarea
                    value={editingRequest.description || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, description: e.target.value })}
                    className={styles.searchInput}
                    style={{ width: '100%', minHeight: '80px' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className={styles.label}>Link URL:</label>
                  <input
                    type="text"
                    value={editingRequest.link_url || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, link_url: e.target.value })}
                    className={styles.searchInput}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className={styles.label}>Image URL:</label>
                  <input
                    type="text"
                    value={editingRequest.image_url || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, image_url: e.target.value })}
                    className={styles.searchInput}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className={styles.label}>Status:</label>
                    <select
                      value={editingRequest.status}
                      onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value })}
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className={styles.label}>Priority:</label>
                    <select
                      value={editingRequest.priority}
                      onChange={(e) => setEditingRequest({ ...editingRequest, priority: e.target.value })}
                      className={styles.filterSelect}
                      style={{ width: '100%' }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className={styles.label}>Notes:</label>
                  <textarea
                    value={editingRequest.notes || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, notes: e.target.value })}
                    className={styles.searchInput}
                    style={{ width: '100%', minHeight: '60px' }}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className={styles.primaryButton}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📱</div>
              <h3>No requests found</h3>
              <p>Start by creating your first social media request</p>
              <Link href="/admin/social-media/requests/new" className={styles.primaryButton}>
                + New Request
              </Link>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Link/Image</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td style={{ fontWeight: 600 }}>{request.title}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {request.description || '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {request.link_url && (
                          <a href={request.link_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', fontSize: '0.875rem' }}>
                            🔗 Link
                          </a>
                        )}
                        {request.image_url && (
                          <a href={request.image_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', fontSize: '0.875rem' }}>
                            🖼️ Image
                          </a>
                        )}
                        {!request.link_url && !request.image_url && '-'}
                      </div>
                    </td>
                    <td>{getPriorityBadge(request.priority)}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>{request.requested_by_name || 'Unknown'}</td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEditClick(request)}
                          className={styles.actionButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(request.id)}
                          className={styles.actionButton}
                          style={{ color: '#dc3545' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.MARKETING);
