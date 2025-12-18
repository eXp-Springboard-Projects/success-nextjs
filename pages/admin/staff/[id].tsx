/**
 * Staff Member Detail View
 * Display full profile and activity for a staff member
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import styles from './StaffDetail.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  postsCount?: number;
  bio?: string;
  avatar?: string;
  departments?: string[];
}

export default function StaffDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (id && session) {
      fetchStaffMember();
    }
  }, [id, session]);

  const fetchStaffMember = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch staff member');
      }
      const data = await res.json();

      // Fetch departments if available
      try {
        const deptRes = await fetch(`/api/admin/departments/user-departments?userId=${id}`);
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          data.departments = deptData.departments;
        }
      } catch (err) {
      }

      setStaff(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading staff member...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !staff) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.error}>
            {error || 'Staff member not found'}
          </div>
          <Link href="/admin/staff" className={styles.backLink}>
            ← Back to Staff List
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/admin/staff" className={styles.backLink}>
            ← Back to Staff List
          </Link>
          <Link href={`/admin/staff/${id}/edit`} className={styles.editButton}>
            ✏️ Edit Staff Member
          </Link>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {staff.avatar ? (
                <img src={staff.avatar} alt={staff.name} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {staff.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h1>{staff.name}</h1>
              <p className={styles.email}>{staff.email}</p>
              <div className={styles.badges}>
                <span className={styles.roleBadge}>{staff.role.replace('_', ' ')}</span>
                <span className={`${styles.statusBadge} ${staff.emailVerified ? styles.active : styles.inactive}`}>
                  {staff.emailVerified ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {staff.bio && (
            <div className={styles.bio}>
              <h3>Bio</h3>
              <p>{staff.bio}</p>
            </div>
          )}
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Account Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Member Since</div>
                <div className={styles.infoValue}>{formatDate(staff.createdAt)}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Last Login</div>
                <div className={styles.infoValue}>{formatDate(staff.lastLoginAt)}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Email Verified</div>
                <div className={styles.infoValue}>
                  {staff.emailVerified ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Posts Authored</div>
                <div className={styles.infoValue}>{staff.postsCount || 0}</div>
              </div>
            </div>
          </div>

          {staff.departments && staff.departments.length > 0 && (
            <div className={styles.card}>
              <h3>Department Access</h3>
              <div className={styles.departmentList}>
                {staff.departments.map((dept) => (
                  <span key={dept} className={styles.deptBadge}>
                    {dept.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionsCard}>
          <h3>Actions</h3>
          <div className={styles.actionButtons}>
            <Link href={`/admin/staff/${id}/edit`} className={styles.actionButton}>
              ✏️ Edit Profile
            </Link>
            <button className={styles.actionButton} onClick={() => alert('Send email feature not yet available')}>
              📧 Send Email
            </button>
            <button className={styles.actionButton} onClick={() => alert('Reset password feature not yet available')}>
              🔐 Reset Password
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
