import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Comments.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  author: string;
  authorEmail: string;
  authorUrl?: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH';
  ipAddress?: string;
  createdAt: string;
}

export default function CommentsModeration() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [bulkAction, setBulkAction] = useState<string>('');

  useEffect(() => {
    // Auth is handled by requireAdminAuth in getServerSideProps
    // No client-side redirects needed
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchComments();
    }
  }, [status, session, filterStatus]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/comments?status=${filterStatus}&perPage=100`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedComments(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedComments.size === 0) return;

    try {
      const res = await fetch('/api/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          entity: 'comment',
          entityIds: Array.from(selectedComments),
        }),
      });

      if (res.ok) {
        alert(`Bulk ${bulkAction.toLowerCase()} queued successfully!`);
        setSelectedComments(new Set());
        setBulkAction('');
        await fetchComments();
      }
    } catch (error) {
      alert('Failed to perform bulk action');
    }
  };

  const handleSingleAction = async (commentId: string, action: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        await fetchComments();
      }
    } catch (error) {
      alert('Failed to update comment');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: '#f59e0b',
      APPROVED: '#10b981',
      SPAM: '#ef4444',
      TRASH: '#6b7280',
    };
    return colors[status] || '#666';
  };

  if (status === 'loading' || loading) {
    return <AdminLayout><div className={styles.loading}>Loading...</div></AdminLayout>;
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Comment Moderation</h1>
            <p className={styles.subtitle}>Manage and moderate comments from your content</p>
          </div>
        </div>

        {/* Filters and Bulk Actions */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={filterStatus === 'PENDING' ? styles.filterActive : styles.filterButton}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('APPROVED')}
              className={filterStatus === 'APPROVED' ? styles.filterActive : styles.filterButton}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus('SPAM')}
              className={filterStatus === 'SPAM' ? styles.filterActive : styles.filterButton}
            >
              Spam
            </button>
            <button
              onClick={() => setFilterStatus('TRASH')}
              className={filterStatus === 'TRASH' ? styles.filterActive : styles.filterButton}
            >
              Trash
            </button>
          </div>

          {selectedComments.size > 0 && (
            <div className={styles.bulkActions}>
              <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                <option value="">Bulk Actions</option>
                <option value="APPROVE">Approve</option>
                <option value="SPAM">Mark as Spam</option>
                <option value="TRASH">Move to Trash</option>
                <option value="DELETE">Delete Permanently</option>
              </select>
              <button onClick={handleBulkAction} className={styles.applyButton}>
                Apply to {selectedComments.size} comment{selectedComments.size > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className={styles.empty}>
            <p>No {filterStatus.toLowerCase()} comments found.</p>
          </div>
        ) : (
          <div className={styles.commentsList}>
            <div className={styles.selectAll}>
              <input
                type="checkbox"
                checked={selectedComments.size === comments.length}
                onChange={handleSelectAll}
              />
              <span>Select All ({comments.length})</span>
            </div>

            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`${styles.commentCard} ${selectedComments.has(comment.id) ? styles.selected : ''}`}
              >
                <div className={styles.commentHeader}>
                  <input
                    type="checkbox"
                    checked={selectedComments.has(comment.id)}
                    onChange={() => toggleSelect(comment.id)}
                  />
                  <div className={styles.authorInfo}>
                    <div className={styles.authorAvatar}>{comment.author[0].toUpperCase()}</div>
                    <div>
                      <strong className={styles.authorName}>{comment.author}</strong>
                      <span className={styles.authorEmail}>{comment.authorEmail}</span>
                      {comment.authorUrl && (
                        <a href={comment.authorUrl} target="_blank" rel="noopener noreferrer" className={styles.authorUrl}>
                          {comment.authorUrl}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className={styles.commentMeta}>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusBadgeColor(comment.status) }}
                    >
                      {comment.status}
                    </span>
                    <span className={styles.timestamp}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className={styles.commentContent}>
                  <p>{comment.content}</p>
                </div>

                <div className={styles.commentFooter}>
                  <span className={styles.postTitle}>
                    On: <strong>{comment.postTitle}</strong>
                  </span>
                  {comment.ipAddress && (
                    <span className={styles.ipAddress}>IP: {comment.ipAddress}</span>
                  )}
                  <div className={styles.actions}>
                    {comment.status !== 'APPROVED' && (
                      <button onClick={() => handleSingleAction(comment.id, 'APPROVE')} className={styles.approveButton}>
                        ✓ Approve
                      </button>
                    )}
                    {comment.status !== 'SPAM' && (
                      <button onClick={() => handleSingleAction(comment.id, 'SPAM')} className={styles.spamButton}>
                        ⚠ Spam
                      </button>
                    )}
                    {comment.status !== 'TRASH' && (
                      <button onClick={() => handleSingleAction(comment.id, 'TRASH')} className={styles.trashButton}>
                        🗑 Trash
                      </button>
                    )}
                    <button onClick={() => handleSingleAction(comment.id, 'DELETE')} className={styles.deleteButton}>
                      ✕ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
