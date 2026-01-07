import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { User, Plus, Edit, Trash2, Search, X } from 'lucide-react';
import styles from './Authors.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  photo?: string;
  email?: string;
  title?: string;
  socialLinkedin?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  website?: string;
  isActive: boolean;
  articleCount?: number;
}

export default function Authors() {
  const { data: session } = useSession();
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bio: '',
    photo: '',
    email: '',
    title: '',
    socialLinkedin: '',
    socialTwitter: '',
    socialFacebook: '',
    website: '',
  });

  useEffect(() => {
    if (!session) return;
    fetchAuthors();
  }, [session]);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/authors');
      if (res.ok) {
        const data = await res.json();
        setAuthors(data);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
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
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const openNewAuthorModal = () => {
    setEditingAuthor(null);
    setFormData({
      name: '',
      slug: '',
      bio: '',
      photo: '',
      email: '',
      title: '',
      socialLinkedin: '',
      socialTwitter: '',
      socialFacebook: '',
      website: '',
    });
    setShowModal(true);
  };

  const openEditAuthorModal = async (author: Author) => {
    // Fetch full author details
    const res = await fetch(`/api/admin/authors/${author.id}`);
    if (res.ok) {
      const fullAuthor = await res.json();
      setEditingAuthor(fullAuthor);
      setFormData({
        name: fullAuthor.name || '',
        slug: fullAuthor.slug || '',
        bio: fullAuthor.bio || '',
        photo: fullAuthor.photo || '',
        email: fullAuthor.email || '',
        title: fullAuthor.title || '',
        socialLinkedin: fullAuthor.socialLinkedin || '',
        socialTwitter: fullAuthor.socialTwitter || '',
        socialFacebook: fullAuthor.socialFacebook || '',
        website: fullAuthor.website || '',
      });
      setShowModal(true);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      alert('Name and slug are required');
      return;
    }

    setSaving(true);
    try {
      const method = editingAuthor ? 'PUT' : 'POST';
      const url = editingAuthor ? `/api/admin/authors/${editingAuthor.id}` : '/api/admin/authors';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchAuthors();
        setShowModal(false);
      } else {
        const error = await res.json();
        alert(`Failed to save author: ${error.message || error.error}`);
      }
    } catch (error) {
      alert('Failed to save author');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (author: Author) => {
    if (!confirm(`Are you sure you want to delete ${author.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/authors/${author.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.deactivated) {
          alert(`${author.name} has been deactivated (has articles)`);
        } else {
          alert(`${author.name} has been deleted`);
        }
        await fetchAuthors();
      } else {
        alert('Failed to delete author');
      }
    } catch (error) {
      alert('Failed to delete author');
    }
  };

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (author.email && author.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (author.title && author.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1><User size={28} /> Author Management</h1>
            <p>Manage article authors and their information</p>
          </div>
          <button onClick={openNewAuthorModal} className={styles.addButton}>
            <Plus size={20} /> New Author
          </button>
        </div>

        <div className={styles.searchBar}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.authorsList}>
          {filteredAuthors.length === 0 ? (
            <div className={styles.empty}>
              <User size={48} />
              <p>No authors found</p>
              <button onClick={openNewAuthorModal} className={styles.addButton}>
                <Plus size={20} /> Create First Author
              </button>
            </div>
          ) : (
            filteredAuthors.map(author => (
              <div key={author.id} className={styles.authorCard}>
                <div className={styles.authorPhoto}>
                  {author.photo ? (
                    <img src={author.photo} alt={author.name} />
                  ) : (
                    <div className={styles.placeholder}>
                      <User size={32} />
                    </div>
                  )}
                </div>
                <div className={styles.authorInfo}>
                  <h3>{author.name}</h3>
                  {author.title && <p className={styles.title}>{author.title}</p>}
                  {author.email && <p className={styles.email}>{author.email}</p>}
                  <div className={styles.meta}>
                    <span className={styles.slug}>/{author.slug}</span>
                    {author.articleCount !== undefined && (
                      <span className={styles.count}>{author.articleCount} articles</span>
                    )}
                    {!author.isActive && <span className={styles.inactive}>Inactive</span>}
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    onClick={() => openEditAuthorModal(author)}
                    className={styles.editButton}
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(author)}
                    className={styles.deleteButton}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>{editingAuthor ? 'Edit Author' : 'New Author'}</h2>
                <button onClick={() => setShowModal(false)} className={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="John Smith"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="john-smith"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Senior Editor"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Author biography..."
                    rows={4}
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Photo URL</label>
                  <input
                    type="text"
                    value={formData.photo}
                    onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                    placeholder="https://..."
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>LinkedIn</label>
                  <input
                    type="text"
                    value={formData.socialLinkedin}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialLinkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Twitter</label>
                  <input
                    type="text"
                    value={formData.socialTwitter}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialTwitter: e.target.value }))}
                    placeholder="https://twitter.com/..."
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Facebook</label>
                  <input
                    type="text"
                    value={formData.socialFacebook}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialFacebook: e.target.value }))}
                    placeholder="https://facebook.com/..."
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={() => setShowModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
                  {saving ? 'Saving...' : 'Save Author'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
