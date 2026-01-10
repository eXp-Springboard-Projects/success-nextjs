import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@/lib/types';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from './Templates.module.css';

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'default'>('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/templates');
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
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/crm/templates/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete template');
      }
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/crm/templates/${id}/duplicate`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/crm/templates/${data.id}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to duplicate template');
      }
    } catch (error) {
      alert('Failed to duplicate template');
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'default' && t.isDefault);
    return matchesSearch && matchesFilter;
  });

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="Email Templates"
      description="Manage reusable email templates for campaigns"
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Email Templates</h1>
            <p className={styles.subtitle}>
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/admin/crm/templates/new" className={styles.createButton}>
            + Create Template
          </Link>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.filterTabs}>
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? styles.filterTabActive : styles.filterTab}
            >
              All Templates
            </button>
            <button
              onClick={() => setFilter('default')}
              className={filter === 'default' ? styles.filterTabActive : styles.filterTab}
            >
              Default Templates
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📧</div>
            <h2>No templates found</h2>
            {searchQuery ? (
              <p>No templates match your search. Try adjusting your filters.</p>
            ) : (
              <>
                <p>Get started by creating your first email template.</p>
                <Link href="/admin/crm/templates/new" className={styles.emptyButton}>
                  Create Template
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredTemplates.map((template) => (
              <div key={template.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{template.name}</h3>
                  {template.isDefault && (
                    <span className={styles.defaultBadge}>Default</span>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardField}>
                    <span className={styles.cardLabel}>Subject:</span>
                    <span className={styles.cardValue}>{template.subject}</span>
                  </div>
                  <div className={styles.cardField}>
                    <span className={styles.cardLabel}>Created:</span>
                    <span className={styles.cardValue}>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.cardField}>
                    <span className={styles.cardLabel}>Last Updated:</span>
                    <span className={styles.cardValue}>
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <Link href={`/admin/crm/templates/${template.id}`} className={styles.editButton}>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDuplicate(template.id)}
                    className={styles.duplicateButton}
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
