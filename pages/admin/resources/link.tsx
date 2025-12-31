import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import { Link as LinkIcon } from 'lucide-react';
import styles from './ResourceForm.module.css';

export default function AddResourceLinkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TEMPLATES',
    linkUrl: '',
    thumbnail: '',
  });

  const categories = ['TEMPLATES', 'GUIDES', 'WORKSHEETS', 'EBOOKS', 'TOOLS', 'CHECKLISTS'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.linkUrl) {
      alert('Please enter a link URL');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileType: 'link',
        }),
      });

      if (res.ok) {
        alert('Resource link added successfully!');
        router.push('/admin/resources');
      } else {
        const error = await res.json();
        alert(`Failed to add link: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to add link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Add Resource Link</h1>
          <p className={styles.subtitle}>Add an external link to the resource library</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.linkPreview}>
            <LinkIcon size={48} className={styles.linkIcon} />
            <div className={styles.linkText}>External Resource Link</div>
          </div>

          <div className={styles.field}>
            <label htmlFor="linkUrl">Link URL *</label>
            <input
              type="url"
              id="linkUrl"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              required
              placeholder="https://example.com/resource"
              className={styles.input}
            />
            <small className={styles.hint}>
              The external URL where the resource is hosted
            </small>
          </div>

          <div className={styles.field}>
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g. Ultimate Goal Setting Worksheet"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Describe what this resource contains and how it helps members..."
              className={styles.textarea}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={styles.select}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="thumbnail">Thumbnail URL (optional)</label>
            <input
              type="url"
              id="thumbnail"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://example.com/preview-image.jpg"
              className={styles.input}
            />
            <small className={styles.hint}>
              An image to display as a preview for this resource
            </small>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Resource Link'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
