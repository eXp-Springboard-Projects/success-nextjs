/**
 * Page Permissions Management
 * Super Admin interface to configure role and department-based access control
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Permissions.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Permission {
  id: string;
  pagePath: string;
  displayName: string;
  description: string;
  category: string;
  isActive: boolean;
  role_permissions: any[];
  department_permissions: any[];
}

export default function PermissionsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState<Permission | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Only SUPER_ADMIN can access
      if (session?.user?.role !== 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        fetchPermissions();
      }
    }
  }, [status, session, router]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/permissions');
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const data = await res.json();
      setPermissions(data.permissions);
      setGrouped(data.grouped);
      // Expand all categories by default
      setExpandedCategories(new Set(Object.keys(data.grouped)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '#d32f2f';
      case 'ADMIN':
        return '#8b5cf6';
      case 'EDITOR':
        return '#3b82f6';
      case 'AUTHOR':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      EDITORIAL: '#3b82f6',
      CUSTOMER_SERVICE: '#10b981',
      SUCCESS_PLUS: '#f59e0b',
      DEV: '#8b5cf6',
      MARKETING: '#ec4899',
      COACHING: '#14b8a6',
      SUPER_ADMIN: '#d32f2f',
    };
    return colors[dept] || '#6b7280';
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading permissions...</div>
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
          <div>
            <h1>Page Permissions</h1>
            <p className={styles.subtitle}>
              Configure role and department-based access control for admin pages
            </p>
          </div>
          <button
            onClick={() => fetchPermissions()}
            className={styles.refreshButton}
          >
            🔄 Refresh
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>ℹ️</div>
          <div>
            <h3>How Permissions Work</h3>
            <ul>
              <li><strong>Super Admins</strong> always have full access to all pages</li>
              <li><strong>Role Permissions</strong> apply to all users with that role (e.g., all EDITORS can access Posts)</li>
              <li><strong>Department Permissions</strong> apply to staff assigned to that department</li>
              <li>A user gets access if EITHER their role OR their department grants permission</li>
              <li>Granular permissions: Access (view), Create, Edit, Delete</li>
            </ul>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{permissions.length}</div>
            <div className={styles.statLabel}>Total Pages</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {permissions.reduce((sum, p) => sum + p.role_permissions.length, 0)}
            </div>
            <div className={styles.statLabel}>Role Permissions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {permissions.reduce((sum, p) => sum + p.department_permissions.length, 0)}
            </div>
            <div className={styles.statLabel}>Dept Permissions</div>
          </div>
        </div>

        <div className={styles.categoriesContainer}>
          {Object.keys(grouped).sort().map((category) => (
            <div key={category} className={styles.categorySection}>
              <div
                className={styles.categoryHeader}
                onClick={() => toggleCategory(category)}
              >
                <span className={styles.categoryIcon}>
                  {expandedCategories.has(category) ? '▼' : '▶'}
                </span>
                <h2>{category}</h2>
                <span className={styles.categoryCount}>
                  {grouped[category].length} pages
                </span>
              </div>

              {expandedCategories.has(category) && (
                <div className={styles.pagesGrid}>
                  {grouped[category].map((page) => (
                    <div key={page.id} className={styles.pageCard}>
                      <div className={styles.pageHeader}>
                        <h3>{page.displayName}</h3>
                        <span className={styles.pagePath}>{page.pagePath}</span>
                      </div>
                      {page.description && (
                        <p className={styles.pageDescription}>{page.description}</p>
                      )}

                      <div className={styles.permissionsSection}>
                        <div className={styles.permissionType}>
                          <strong>Role Access:</strong>
                          <div className={styles.badges}>
                            {page.role_permissions
                              .filter((rp: any) => rp.canAccess)
                              .map((rp: any) => (
                                <span
                                  key={rp.role}
                                  className={styles.badge}
                                  style={{ background: getRoleColor(rp.role) }}
                                >
                                  {rp.role.replace('_', ' ')}
                                  {rp.canCreate && ' ✏️'}
                                  {rp.canDelete && ' 🗑️'}
                                </span>
                              ))}
                            {page.role_permissions.filter((rp: any) => rp.canAccess)
                              .length === 0 && (
                              <span className={styles.noneText}>None</span>
                            )}
                          </div>
                        </div>

                        <div className={styles.permissionType}>
                          <strong>Department Access:</strong>
                          <div className={styles.badges}>
                            {page.department_permissions
                              .filter((dp: any) => dp.canAccess)
                              .map((dp: any) => (
                                <span
                                  key={dp.department}
                                  className={styles.badge}
                                  style={{ background: getDepartmentColor(dp.department) }}
                                >
                                  {dp.department.replace('_', ' ')}
                                  {dp.canCreate && ' ✏️'}
                                  {dp.canDelete && ' 🗑️'}
                                </span>
                              ))}
                            {page.department_permissions.filter((dp: any) => dp.canAccess)
                              .length === 0 && (
                              <span className={styles.noneText}>None</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedPage(page)}
                        className={styles.editButton}
                      >
                        ⚙️ Configure
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedPage && (
          <div className={styles.modal} onClick={() => setSelectedPage(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Configure: {selectedPage.displayName}</h2>
              <p className={styles.modalPath}>{selectedPage.pagePath}</p>
              <p className={styles.modalNote}>
                To update permissions, use the seed script or database query.
              </p>
              <button onClick={() => setSelectedPage(null)} className={styles.closeButton}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
