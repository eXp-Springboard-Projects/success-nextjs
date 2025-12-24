import { useState, useEffect } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import FilterBuilder from '@/components/admin/crm/FilterBuilder';
import styles from './Lists.module.css';

export default function NewList() {
  const router = useRouter();
  const { type } = router.query;
  const [listType, setListType] = useState<'STATIC' | 'DYNAMIC'>('STATIC');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<any>({ conditions: [], logic: 'AND' });
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (type === 'dynamic') {
      setListType('DYNAMIC');
    } else if (type === 'static') {
      setListType('STATIC');
    }
  }, [type]);

  const handlePreview = async () => {
    try {
      const res = await fetch('/api/admin/crm/lists/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      const data = await res.json();
      setPreviewCount(data.count);
    } catch (error) {
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a list name');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/crm/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type: listType,
          filters: listType === 'DYNAMIC' ? filters : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/crm/lists/${data.id}`);
      } else {
        alert('Failed to create list');
      }
    } catch (error) {
      alert('Failed to create list');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUPER_ADMIN}
      pageTitle={`Create ${listType === 'STATIC' ? 'List' : 'Segment'}`}
      description="Create a new contact list or dynamic segment"
    >
      <div className={styles.dashboard}>
        <Link href="/admin/crm/lists" className={styles.backLink}>
          ← Back to Lists
        </Link>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>List Details</h2>

          {/* Type Selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>List Type</label>
            <div className={styles.typeSelector}>
              <button
                onClick={() => setListType('STATIC')}
                className={`${styles.typeButton} ${listType === 'STATIC' ? styles.typeButtonActive : ''}`}
              >
                <span className={styles.typeIcon}>📋</span>
                <div>
                  <div className={styles.typeButtonTitle}>Static List</div>
                  <div className={styles.typeButtonDescription}>
                    Manually add and remove contacts
                  </div>
                </div>
              </button>
              <button
                onClick={() => setListType('DYNAMIC')}
                className={`${styles.typeButton} ${listType === 'DYNAMIC' ? styles.typeButtonActive : ''}`}
              >
                <span className={styles.typeIcon}>🎯</span>
                <div>
                  <div className={styles.typeButtonTitle}>Smart Segment</div>
                  <div className={styles.typeButtonDescription}>
                    Automatically updated based on rules
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Newsletter Subscribers, Active Customers"
              className={styles.formInput}
            />
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this list..."
              className={styles.formTextarea}
              rows={3}
            />
          </div>
        </div>

        {/* Filter Builder for Dynamic Lists */}
        {listType === 'DYNAMIC' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Filter Rules</h2>
            <FilterBuilder filters={filters} onChange={setFilters} />

            <div className={styles.previewSection}>
              <button onClick={handlePreview} className={styles.previewButton}>
                Preview Matching Contacts
              </button>
              {previewCount !== null && (
                <div className={styles.previewResult}>
                  <span className={styles.previewIcon}>👥</span>
                  <span className={styles.previewCount}>{previewCount}</span>
                  <span className={styles.previewLabel}>contacts match these filters</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.formActions}>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className={styles.createButtonLarge}
          >
            {saving ? 'Creating...' : `Create ${listType === 'STATIC' ? 'List' : 'Segment'}`}
          </button>
          <button onClick={() => router.back()} className={styles.cancelButtonLarge}>
            Cancel
          </button>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUPER_ADMIN);
