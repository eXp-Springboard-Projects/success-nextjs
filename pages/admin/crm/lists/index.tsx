import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Lists.module.css';

interface List {
  id: string;
  name: string;
  description: string | null;
  type: 'STATIC' | 'DYNAMIC';
  isSystem?: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ListsIndex() {
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/admin/crm/lists');
      const data = await res.json();
      setLists(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      await fetch(`/api/admin/crm/lists/${id}`, { method: 'DELETE' });
      fetchLists();
      setDeleteConfirm(null);
    } catch (error) {
    }
  };

  const handleDuplicate = async (list: List) => {
    try {
      const res = await fetch('/api/admin/crm/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${list.name} (Copy)`,
          description: list.description,
          type: list.type,
          filters: list.type === 'DYNAMIC' ? {} : null,
        }),
      });
      if (res.ok) {
        fetchLists();
      }
    } catch (error) {
    }
  };

  const staticLists = lists.filter((l) => l.type === 'STATIC');
  const dynamicLists = lists.filter((l) => l.type === 'DYNAMIC');

  return (
    <DepartmentLayout
      currentDepartment={Department.SUPER_ADMIN}
      pageTitle="Lists"
      description="Manage contact lists"
    >
      <div className={styles.dashboard}>
        {/* Header Actions */}
        <div className={styles.headerActions}>
          <Link href="/admin/crm/lists/new" className={styles.createButton}>
            <span className={styles.createIcon}>+</span>
            Create List
          </Link>
        </div>

        {/* All Lists Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            All Lists ({lists.length})
          </h2>
          {loading ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : lists.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <div>No lists yet</div>
              <Link href="/admin/crm/lists/new" className={styles.emptyAction}>
                Create your first list
              </Link>
            </div>
          ) : (
            <div className={styles.listsGrid}>
              {lists.map((list) => (
                <div key={list.id} className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h3 className={styles.listName}>{list.name}</h3>
                    <div className={styles.badges}>
                      <span className={styles.typeBadge} data-type={list.type === 'STATIC' ? 'static' : 'dynamic'}>
                        {list.type === 'STATIC' ? '📋 Manual' : '🎯 Auto-Update'}
                      </span>
                      {list.isSystem && (
                        <span className={styles.systemBadge} title="This list is automatically managed by the system">
                          🔒 System
                        </span>
                      )}
                    </div>
                  </div>
                  {list.description && (
                    <p className={styles.listDescription}>{list.description}</p>
                  )}
                  <div className={styles.listStats}>
                    <div className={styles.listStat}>
                      <span className={styles.statIcon}>👥</span>
                      <span className={styles.statValue}>{list.memberCount}</span>
                      <span className={styles.statLabel}>members</span>
                    </div>
                    <div className={styles.listStat}>
                      <span className={styles.statIcon}>📅</span>
                      <span className={styles.statValue}>
                        {new Date(list.updatedAt).toLocaleDateString()}
                      </span>
                      <span className={styles.statLabel}>updated</span>
                    </div>
                  </div>
                  <div className={styles.listActions}>
                    <button
                      onClick={() => router.push(`/admin/crm/lists/${list.id}`)}
                      className={styles.actionButton}
                    >
                      View Members
                    </button>
                    {!list.isSystem && (
                      <>
                        <button
                          onClick={() => handleDuplicate(list)}
                          className={styles.actionButton}
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(list.id)}
                          className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                        >
                          {deleteConfirm === list.id ? 'Confirm?' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUPER_ADMIN);
