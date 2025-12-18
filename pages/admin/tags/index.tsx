import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './AdminTags.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: {
    posts: number;
  };
}

export default function AdminTags() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTags();
    }
  }, [session]);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags?per_page=100');
      const data = await res.json();
      setTags(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingId && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Tag name is required');
      return;
    }

    setSaving(true);

    const tagData = {
      name,
      slug: slug || generateSlug(name),
    };

    try {
      const url = editingId ? `/api/tags/${editingId}` : '/api/tags';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData),
      });

      if (res.ok) {
        await fetchTags();
        resetForm();
        setShowAddForm(false);
      } else {
        throw new Error('Failed to save tag');
      }
    } catch (error) {
      alert('Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setSlug(tag.slug);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTags(tags.filter(t => t.id !== id));
      } else {
        throw new Error('Failed to delete tag');
      }
    } catch (error) {
      alert('Failed to delete tag');
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
    setShowAddForm(false);
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading tags...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Tags</h1>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className={styles.addButton}
            >
              + Add Tag
            </button>
          )}
        </div>

        {showAddForm && (
          <div className={styles.formCard}>
            <h2>{editingId ? 'Edit Tag' : 'Add New Tag'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Tag name"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="slug">Slug</label>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="tag-slug"
                  className={styles.input}
                />
                <small>The "slug" is the URL-friendly version of the name.</small>
              </div>

              <div className={styles.formActions}>
                <button type="submit" disabled={saving} className={styles.saveButton}>
                  {saving ? 'Saving...' : editingId ? 'Update Tag' : 'Add Tag'}
                </button>
                <button type="button" onClick={cancelEdit} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={styles.tableCard}>
          {tags.length === 0 ? (
            <div className={styles.empty}>
              <p>No tags yet. Create your first tag!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td className={styles.nameCell}>{tag.name}</td>
                    <td className={styles.slugCell}>{tag.slug}</td>
                    <td className={styles.countCell}>
                      {tag._count?.posts || 0}
                    </td>
                    <td className={styles.actions}>
                      <button
                        onClick={() => handleEdit(tag)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
