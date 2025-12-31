import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import { Upload, Link as LinkIcon, Edit, Trash2, Download } from 'lucide-react';
import styles from './Resources.module.css';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl?: string;
  linkUrl?: string;
  fileType: string;
  fileSize?: number;
  thumbnail?: string;
  downloads: number;
  createdAt: string;
  isActive: boolean;
}

export default function AdminResourcesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchResources();
  }, [categoryFilter]);

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const res = await fetch(`/api/admin/resources?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setResources(resources.filter(r => r.id !== id));
      } else {
        alert('Failed to delete resource');
      }
    } catch (error) {
      alert('Failed to delete resource');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        fetchResources();
      }
    } catch (error) {
      alert('Failed to update resource');
    }
  };

  const categories = ['TEMPLATES', 'GUIDES', 'WORKSHEETS', 'EBOOKS', 'TOOLS', 'CHECKLISTS'];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Resource Library</h1>
            <p className={styles.subtitle}>Manage downloadable resources for members</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/admin/resources/upload" className={styles.createButton}>
              <Upload size={18} />
              Upload File
            </Link>
            <Link href="/admin/resources/link" className={styles.createButton}>
              <LinkIcon size={18} />
              Add Link
            </Link>
          </div>
        </div>

        <div className={styles.filters}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.categorySelect}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0) + category.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className={styles.empty}>
            <Upload className={styles.emptyIcon} />
            <h2>No resources yet</h2>
            <p>Upload your first resource to get started</p>
            <Link href="/admin/resources/upload" className={styles.createButton}>
              Upload File
            </Link>
          </div>
        ) : (
          <div className={styles.resourcesTable}>
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Downloads</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource.id}>
                    <td>
                      <div className={styles.resourceInfo}>
                        <div>
                          <div className={styles.resourceTitle}>{resource.title}</div>
                          <div className={styles.resourceDescription}>
                            {resource.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {resource.category.charAt(0) + resource.category.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <span className={styles.typeBadge}>
                        {resource.linkUrl ? 'LINK' : resource.fileType.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.sizeCell}>
                      {formatFileSize(resource.fileSize)}
                    </td>
                    <td className={styles.downloadsCell}>
                      <Download size={14} />
                      {resource.downloads}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(resource.id, resource.isActive)}
                        className={`${styles.statusBadge} ${
                          resource.isActive ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {resource.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/resources/${resource.id}/edit`}
                          className={styles.actionButton}
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(resource.id, resource.title)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
