import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import { ArrowLeft, Save } from 'lucide-react';
import styles from '../Resources.module.css';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl?: string;
  linkUrl?: string;
  fileType: string;
  thumbnail?: string;
  isActive: boolean;
}

export default function EditResourcePage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TEMPLATES',
    linkUrl: '',
    thumbnail: '',
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      fetchResource();
    }
  }, [id]);

  const fetchResource = async () => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`);
      if (res.ok) {
        const data = await res.json();
        setResource(data);
        setFormData({
          title: data.title,
          description: data.description,
          category: data.category,
          linkUrl: data.linkUrl || '',
          thumbnail: data.thumbnail || '',
          isActive: data.isActive,
        });
      } else {
        alert('Resource not found');
        router.push('/admin/resources');
      }
    } catch (error) {
      alert('Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Resource updated successfully');
        router.push('/admin/resources');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update resource');
      }
    } catch (error) {
      alert('Failed to update resource');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading resource...</div>
      </AdminLayout>
    );
  }

  if (!resource) {
    return (
      <AdminLayout>
        <div className={styles.error}>Resource not found</div>
      </AdminLayout>
    );
  }

  const categories = ['TEMPLATES', 'GUIDES', 'WORKSHEETS', 'EBOOKS', 'TOOLS', 'CHECKLISTS'];

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/admin/resources" className={styles.backButton}>
            <ArrowLeft size={18} />
            Back to Resources
          </Link>
          <h1>Edit Resource</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className={styles.select}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {resource.linkUrl && (
            <div className={styles.formGroup}>
              <label htmlFor="linkUrl">Link URL</label>
              <input
                type="url"
                id="linkUrl"
                name="linkUrl"
                value={formData.linkUrl}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="thumbnail">Thumbnail URL</label>
            <input
              type="url"
              id="thumbnail"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span>Active (visible to members)</span>
            </label>
          </div>

          {resource.fileUrl && (
            <div className={styles.infoBox}>
              <strong>Current File:</strong> {resource.fileType.toUpperCase()}
              <br />
              <small>Note: File cannot be changed after upload. Create a new resource to upload a different file.</small>
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/admin/resources')}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={styles.saveButton}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
