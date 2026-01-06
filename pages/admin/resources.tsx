import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../../styles/AdminResources.module.css';

interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  'Guides & Workbooks',
  'Leadership & Management',
  'Planners & Trackers',
  'Finance & Money',
  'Career Development',
  'Personal Growth',
  'Business & Entrepreneurship',
  'Health & Wellness',
  'Seasonal & Holiday',
  'General Resources'
];

export default function AdminResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/resources');
      return;
    }

    if (status === 'authenticated') {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
        router.push('/');
        return;
      }
      fetchResources();
    }
  }, [status, router, session]);

  useEffect(() => {
    filterResources();
  }, [resources, selectedCategory, searchQuery]);

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/admin/resources');
      const data = await res.json();
      setResources(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.fileName.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    setFilteredResources(filtered);
  };

  const handleToggleFeatured = async (resource: Resource) => {
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !resource.featured })
      });

      if (res.ok) {
        fetchResources();
      }
    } catch (error) {
      console.error('Failed to update resource:', error);
      alert('Failed to update resource');
    }
  };

  const handleToggleActive = async (resource: Resource) => {
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !resource.isActive })
      });

      if (res.ok) {
        fetchResources();
      }
    } catch (error) {
      console.error('Failed to update resource:', error);
      alert('Failed to update resource');
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingResource) return;

    try {
      const res = await fetch(`/api/admin/resources/${editingResource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingResource.title,
          description: editingResource.description,
          category: editingResource.category
        })
      });

      if (res.ok) {
        fetchResources();
        setShowEditModal(false);
        setEditingResource(null);
      }
    } catch (error) {
      console.error('Failed to save resource:', error);
      alert('Failed to save resource');
    }
  };

  const handleSeedResources = async () => {
    if (!confirm('This will catalog all PDF files from /public/resources/success-plus/ into the database. Continue?')) {
      return;
    }

    setSeeding(true);
    try {
      const res = await fetch('/api/admin/resources/seed', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Success!\nInserted: ${data.summary.inserted}\nUpdated: ${data.summary.updated}\nSkipped: ${data.summary.skipped}`);
        fetchResources();
      } else {
        alert(`Failed to seed resources: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Failed to seed resources:', error);
      alert('Failed to seed resources');
    } finally {
      setSeeding(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalDownloads = () => {
    return resources.reduce((sum, r) => sum + r.downloadCount, 0);
  };

  const getMostDownloaded = () => {
    return [...resources].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 5);
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading resources...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Resources Management</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSeedResources}
              className={styles.backButton}
              disabled={seeding}
              style={{ background: '#0066cc', color: 'white' }}
            >
              {seeding ? '🔄 Cataloging...' : '📁 Catalog PDFs'}
            </button>
            <button onClick={() => router.push('/admin')} className={styles.backButton}>
              ← Back to Admin
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{resources.length}</div>
            <div className={styles.statLabel}>Total Resources</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{resources.filter(r => r.isActive).length}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{resources.filter(r => r.featured).length}</div>
            <div className={styles.statLabel}>Featured</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{getTotalDownloads().toLocaleString()}</div>
            <div className={styles.statLabel}>Total Downloads</div>
          </div>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.sidebar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filters}>
            <h3 className={styles.filtersTitle}>Categories</h3>
            <button
              onClick={() => setSelectedCategory('All')}
              className={selectedCategory === 'All' ? styles.filterButtonActive : styles.filterButton}
            >
              All Resources ({resources.length})
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? styles.filterButtonActive : styles.filterButton}
              >
                {category} ({resources.filter(r => r.category === category).length})
              </button>
            ))}
          </div>

          <div className={styles.topDownloads}>
            <h3 className={styles.filtersTitle}>Most Downloaded</h3>
            {getMostDownloaded().map((resource, index) => (
              <div key={resource.id} className={styles.topDownloadItem}>
                <span className={styles.topDownloadRank}>#{index + 1}</span>
                <div className={styles.topDownloadInfo}>
                  <div className={styles.topDownloadTitle}>{resource.title}</div>
                  <div className={styles.topDownloadCount}>{resource.downloadCount} downloads</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>
              {selectedCategory === 'All' ? 'All Resources' : selectedCategory}
            </h2>
            <p className={styles.resultsCount}>
              {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredResources.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No resources found matching your criteria.</p>
            </div>
          ) : (
            <div className={styles.resourceList}>
              {filteredResources.map(resource => (
                <div key={resource.id} className={styles.resourceRow}>
                  <div className={styles.resourceInfo}>
                    <div className={styles.resourceHeader}>
                      <h3 className={styles.resourceTitle}>{resource.title}</h3>
                      <div className={styles.resourceBadges}>
                        {resource.featured && (
                          <span className={styles.badgeFeatured}>★ Featured</span>
                        )}
                        {!resource.isActive && (
                          <span className={styles.badgeInactive}>Inactive</span>
                        )}
                      </div>
                    </div>
                    {resource.description && (
                      <p className={styles.resourceDescription}>{resource.description}</p>
                    )}
                    <div className={styles.resourceMeta}>
                      <span className={styles.metaItem}>
                        <strong>Category:</strong> {resource.category}
                      </span>
                      <span className={styles.metaItem}>
                        <strong>File:</strong> {resource.fileName}
                      </span>
                      <span className={styles.metaItem}>
                        <strong>Size:</strong> {formatFileSize(resource.fileSize)}
                      </span>
                      <span className={styles.metaItem}>
                        <strong>Downloads:</strong> {resource.downloadCount}
                      </span>
                      <span className={styles.metaItem}>
                        <strong>Added:</strong> {formatDate(resource.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.resourceActions}>
                    <button
                      onClick={() => window.open(resource.fileUrl, '_blank')}
                      className={styles.actionButton}
                      title="Preview"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleEditResource(resource)}
                      className={styles.actionButton}
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleToggleFeatured(resource)}
                      className={resource.featured ? styles.actionButtonActive : styles.actionButton}
                      title={resource.featured ? 'Unfeature' : 'Feature'}
                    >
                      ★ {resource.featured ? 'Featured' : 'Feature'}
                    </button>
                    <button
                      onClick={() => handleToggleActive(resource)}
                      className={resource.isActive ? styles.actionButton : styles.actionButtonDanger}
                      title={resource.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {resource.isActive ? '✓ Active' : '✗ Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingResource && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Resource</h2>
              <button onClick={() => setShowEditModal(false)} className={styles.closeButton}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Title</label>
                <input
                  type="text"
                  value={editingResource.title}
                  onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  value={editingResource.description || ''}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                  className={styles.textarea}
                  rows={4}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                <select
                  value={editingResource.category}
                  onChange={(e) => setEditingResource({ ...editingResource, category: e.target.value })}
                  className={styles.select}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowEditModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} className={styles.saveButton}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
