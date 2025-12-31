import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from './Templates.module.css';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: any;
  thumbnail?: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function Templates() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTemplates();
    }
  }, [session]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          name: `${template.name} (Copy)`,
          id: undefined,
        }),
      });

      if (res.ok) {
        fetchTemplates();
      } else {
        alert('Failed to duplicate template');
      }
    } catch (error) {
      alert('Failed to duplicate template');
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesSearch =
      searchTerm === '' ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'article', label: 'Article Layouts' },
    { value: 'landing', label: 'Landing Pages' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'email', label: 'Email Templates' },
    { value: 'page', label: 'Page Layouts' },
    { value: 'custom', label: 'Custom' },
  ];

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading templates...</div>
      </AdminLayout>
    );
  }

  if (!session) return null;

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Template Builder</h1>
            <p className={styles.subtitle}>
              Create and manage reusable content templates
            </p>
          </div>
          <Link href="/admin/templates/new" className={styles.newButton}>
            ✨ Create Template
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📋</div>
            <div className={styles.statContent}>
              <h3>Total Templates</h3>
              <p className={styles.statNumber}>{templates.length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🌐</div>
            <div className={styles.statContent}>
              <h3>Public</h3>
              <p className={styles.statNumber}>
                {templates.filter(t => t.isPublic).length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔒</div>
            <div className={styles.statContent}>
              <h3>Private</h3>
              <p className={styles.statNumber}>
                {templates.filter(t => !t.isPublic).length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <h3>Total Uses</h3>
              <p className={styles.statNumber}>
                {templates.reduce((sum, t) => sum + t.usageCount, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.categorySelect}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No templates found</h3>
            <p>Create your first template to get started</p>
            <Link href="/admin/templates/new" className={styles.emptyButton}>
              Create Template
            </Link>
          </div>
        ) : (
          <div className={styles.templatesGrid}>
            {filteredTemplates.map((template) => (
              <div key={template.id} className={styles.templateCard}>
                <div className={styles.templateThumbnail}>
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} />
                  ) : (
                    <div className={styles.placeholderThumbnail}>
                      <span>📄</span>
                    </div>
                  )}
                  <div className={styles.templateOverlay}>
                    <Link
                      href={`/admin/templates/${template.id}`}
                      className={styles.overlayButton}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className={styles.overlayButton}
                    >
                      Duplicate
                    </button>
                  </div>
                </div>
                <div className={styles.templateInfo}>
                  <div className={styles.templateHeader}>
                    <h3>{template.name}</h3>
                    <span className={styles.categoryBadge}>
                      {template.category}
                    </span>
                  </div>
                  <p className={styles.templateDescription}>
                    {template.description}
                  </p>
                  <div className={styles.templateMeta}>
                    <span className={styles.metaItem}>
                      📊 {template.usageCount} uses
                    </span>
                    <span className={styles.metaItem}>
                      {template.isPublic ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>
                  <div className={styles.templateActions}>
                    <Link
                      href={`/admin/templates/${template.id}`}
                      className={styles.actionLink}
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/templates/${template.id}/preview`}
                      className={styles.actionLink}
                    >
                      Preview
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      className={styles.deleteLink}
                    >
                      Delete
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

export const getServerSideProps = requireAdminAuth;
