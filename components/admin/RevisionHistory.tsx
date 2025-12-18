/**
 * Revision History Modal
 * Shows version history of a post with ability to restore previous versions
 */

import { useState, useEffect } from 'react';
import styles from './RevisionHistory.module.css';

interface Revision {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  status: string;
  seoTitle?: string;
  seoDescription?: string;
  authorId: string;
  authorName: string;
  changeNote?: string;
  createdAt: string;
}

interface RevisionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onRestore: (revision: Revision) => void;
}

export default function RevisionHistory({
  isOpen,
  onClose,
  postId,
  onRestore,
}: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchRevisions();
    }
  }, [isOpen, postId]);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (revision: Revision) => {
    if (confirm(`Restore this version from ${formatDate(revision.createdAt)}?\n\nThis will replace the current content.`)) {
      onRestore(revision);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeDifference = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Revision History</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading revisions...</p>
            </div>
          ) : revisions.length === 0 ? (
            <div className={styles.empty}>
              <p>No revision history available for this post.</p>
              <small>Revisions are saved automatically when you make changes.</small>
            </div>
          ) : (
            <div className={styles.revisionLayout}>
              {/* Revision List */}
              <div className={styles.revisionList}>
                {revisions.map((revision, index) => (
                  <div
                    key={revision.id}
                    className={`${styles.revisionItem} ${selectedRevision?.id === revision.id ? styles.selected : ''}`}
                    onClick={() => setSelectedRevision(revision)}
                  >
                    <div className={styles.revisionHeader}>
                      <span className={styles.revisionTime}>
                        {getTimeDifference(revision.createdAt)}
                      </span>
                      {index === 0 && (
                        <span className={styles.currentBadge}>Current</span>
                      )}
                    </div>
                    <div className={styles.revisionMeta}>
                      <span className={styles.revisionAuthor}>
                        {revision.authorName}
                      </span>
                      <span className={styles.revisionDate}>
                        {formatDate(revision.createdAt)}
                      </span>
                    </div>
                    {revision.changeNote && (
                      <div className={styles.changeNote}>
                        {revision.changeNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Preview Panel */}
              {selectedRevision && (
                <div className={styles.previewPanel}>
                  <div className={styles.previewHeader}>
                    <h3>Preview</h3>
                    <button
                      onClick={() => handleRestore(selectedRevision)}
                      className={styles.restoreButton}
                    >
                      ⟲ Restore This Version
                    </button>
                  </div>

                  <div className={styles.previewContent}>
                    {/* Title */}
                    <div className={styles.field}>
                      <label>Title</label>
                      <div className={styles.fieldValue}>
                        {selectedRevision.title}
                      </div>
                    </div>

                    {/* Excerpt */}
                    {selectedRevision.excerpt && (
                      <div className={styles.field}>
                        <label>Excerpt</label>
                        <div className={styles.fieldValue}>
                          {selectedRevision.excerpt}
                        </div>
                      </div>
                    )}

                    {/* Featured Image */}
                    {selectedRevision.featuredImage && (
                      <div className={styles.field}>
                        <label>Featured Image</label>
                        <div className={styles.imagePreview}>
                          <img
                            src={selectedRevision.featuredImage}
                            alt={selectedRevision.featuredImageAlt || 'Featured'}
                          />
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className={styles.field}>
                      <label>Content</label>
                      <div
                        className={styles.contentPreview}
                        dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
                      />
                    </div>

                    {/* SEO */}
                    {(selectedRevision.seoTitle || selectedRevision.seoDescription) && (
                      <div className={styles.field}>
                        <label>SEO</label>
                        {selectedRevision.seoTitle && (
                          <div className={styles.fieldValue}>
                            <strong>Title:</strong> {selectedRevision.seoTitle}
                          </div>
                        )}
                        {selectedRevision.seoDescription && (
                          <div className={styles.fieldValue}>
                            <strong>Description:</strong> {selectedRevision.seoDescription}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <div className={styles.field}>
                      <label>Status</label>
                      <div className={styles.fieldValue}>
                        <span className={styles.statusBadge}>
                          {selectedRevision.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
