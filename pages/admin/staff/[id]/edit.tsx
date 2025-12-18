/**
 * Staff Member Edit Page
 * Allows admins to edit staff member details, roles, and department assignments
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import Link from 'next/link';
import styles from './StaffEdit.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type Department =
  | 'SUPER_ADMIN'
  | 'CUSTOMER_SERVICE'
  | 'EDITORIAL'
  | 'SUCCESS_PLUS'
  | 'DEV'
  | 'MARKETING'
  | 'COACHING';

const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'EDITORIAL', label: 'Editorial' },
  { value: 'SUCCESS_PLUS', label: 'SUCCESS+' },
  { value: 'DEV', label: 'Dev' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'COACHING', label: 'Coaching' },
];

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive?: boolean;
  bio?: string;
  departments?: string[];
}

export default function StaffEdit() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [bio, setBio] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

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

      // Fetch departments
      try {
        const deptRes = await fetch(`/api/admin/departments/user-departments?userId=${id}`);
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          data.departments = deptData.departments;
        }
      } catch (err) {
      }

      setStaff(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setRole(data.role || 'EDITOR');
      setBio(data.bio || '');
      setDepartments(data.departments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Update user details
      const updateRes = await fetch(`/api/admin/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          bio,
        }),
      });

      if (!updateRes.ok) {
        const data = await updateRes.json();
        throw new Error(data.error || 'Failed to update staff member');
      }

      // Update departments (Super Admin only)
      if (session?.user?.role === 'SUPER_ADMIN') {
        const deptRes = await fetch('/api/admin/departments/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: id,
            departments,
          }),
        });

        if (!deptRes.ok) {
          const data = await deptRes.json();
          throw new Error(data.error || 'Failed to update departments');
        }
      }

      setSuccess('Staff member updated successfully!');

      // Refresh data
      await fetchStaffMember();

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/admin/staff/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member');
    } finally {
      setSaving(false);
    }
  };

  const toggleDepartment = (dept: Department) => {
    if (departments.includes(dept)) {
      setDepartments(departments.filter(d => d !== dept));
    } else {
      setDepartments([...departments, dept]);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Are you sure you want to deactivate ${staff?.name}'s account? They will not be able to log in.`)) {
      return;
    }

    const reason = prompt('Optional: Provide a reason for deactivation');

    setDeactivating(true);
    try {
      const res = await fetch(`/api/admin/staff/${id}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✓ Account deactivated successfully`);
        await fetchStaffMember(); // Refresh data
      } else {
        alert(`✗ Failed to deactivate: ${data.error}`);
      }
    } catch (error) {
      alert('✗ Failed to deactivate account');
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirm(`Reactivate ${staff?.name}'s account? They will be able to log in again.`)) {
      return;
    }

    setDeactivating(true);
    try {
      const res = await fetch(`/api/admin/staff/${id}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✓ Account reactivated successfully`);
        await fetchStaffMember(); // Refresh data
      } else {
        alert(`✗ Failed to reactivate: ${data.error}`);
      }
    } catch (error) {
      alert('✗ Failed to reactivate account');
    } finally {
      setDeactivating(false);
    }
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

  if (error && !staff) {
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

  const isSuperAdmin = session.user?.role === 'SUPER_ADMIN';

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Edit Staff Member</h1>
            <p className={styles.subtitle}>
              Update staff member details, role, and department assignments
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href={`/admin/staff/${id}`} className={styles.backLink}>
              ← Back to Profile
            </Link>
            <Link href="/admin/staff" className={styles.backLink}>
              ← Staff List
            </Link>
          </div>
        </div>

        <div className={styles.formCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={styles.select}
                required
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="AUTHOR">Author</option>
              </select>
              <small>Changing role will update their access permissions</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bio">Bio (Optional)</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={styles.textarea}
                rows={4}
                placeholder="Brief bio or description..."
              />
            </div>

            {isSuperAdmin && (
              <div className={styles.formGroup}>
                <label>Department Access</label>
                <div className={styles.departmentGrid}>
                  {DEPARTMENTS.map((dept) => (
                    <label key={dept.value} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={departments.includes(dept.value)}
                        onChange={() => toggleDepartment(dept.value)}
                        className={styles.checkbox}
                      />
                      {dept.label}
                    </label>
                  ))}
                </div>
                <small>Select departments this user can access</small>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => router.push(`/admin/staff/${id}`)}
                className={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={styles.submitButton}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {staff && isSuperAdmin && (
          <div className={styles.dangerZone}>
            <h3>{staff.isActive !== false ? 'Danger Zone' : 'Account Status'}</h3>
            <p>
              {staff.isActive !== false
                ? 'Deactivating this account will prevent the user from logging in. This action can be reversed.'
                : 'This account is currently deactivated. Reactivate to allow login.'}
            </p>
            <button
              className={staff.isActive !== false ? styles.dangerButton : styles.reactivateButton}
              onClick={staff.isActive !== false ? handleDeactivate : handleReactivate}
              disabled={deactivating}
            >
              {deactivating
                ? 'Processing...'
                : staff.isActive !== false
                ? '🚫 Deactivate Account'
                : '✅ Reactivate Account'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
