import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import RoleBadges from '../../../components/admin/RoleBadges';
import Link from 'next/link';
import styles from './AdminUsers.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'STAFF';
type MembershipTier = 'Free' | 'Customer' | 'SUCCESSPlus' | 'VIP' | 'Enterprise';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  avatar?: string;
  departments?: string[];
  membershipTier?: MembershipTier | null;
  membershipStatus?: string | null;
  totalSpent?: number;
}

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

export default function AdminUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchUsers();
      // Check if current user is Super Admin
      setIsSuperAdmin(session.user?.role === 'SUPER_ADMIN');
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?per_page=100');
      const data = await res.json();

      // Fetch departments for each user if we're super admin
      if (isSuperAdmin) {
        const usersWithDepts = await Promise.all(
          data.map(async (user: User) => {
            try {
              const deptsRes = await fetch(`/api/admin/departments/user-departments?userId=${user.id}`);
              if (deptsRes.ok) {
                const deptsData = await deptsRes.json();
                return { ...user, departments: deptsData.departments };
              }
            } catch (err) {
            }
            return { ...user, departments: [] };
          })
        );
        setUsers(usersWithDepts);
      } else {
        setUsers(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDepartments = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/departments/user-departments?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDepartments(data.departments || []);
      }
    } catch (error) {
      setSelectedDepartments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Name and email are required');
      return;
    }

    if (!editingId && !password) {
      alert('Password is required for new users');
      return;
    }

    setSaving(true);

    const userData: any = {
      name,
      email,
      role,
      bio,
      avatar,
    };

    if (password) {
      userData.password = password;
    }

    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        const savedUser = await res.json();
        const userId = editingId || savedUser.id;

        // Update departments if super admin
        if (isSuperAdmin && userId) {
          await fetch('/api/admin/departments/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              departments: selectedDepartments,
            }),
          });
        }

        await fetchUsers();
        resetForm();
        setShowAddForm(false);
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save user');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (user: User) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setBio('');
    setAvatar(user.avatar || '');
    setPassword('');

    // Fetch user's departments if super admin
    if (isSuperAdmin) {
      await fetchUserDepartments(user.id);
    }

    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (id === session?.user?.id) {
      alert("You cannot delete your own account!");
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('EDITOR');
    setBio('');
    setAvatar('');
    setSelectedDepartments([]);
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
    setShowAddForm(false);
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading users...</div>
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
          <h1>Users</h1>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className={styles.addButton}
            >
              + Add User
            </button>
          )}
        </div>

        {showAddForm && (
          <div className={styles.formCard}>
            <h2>{editingId ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="password">Password {!editingId && '*'}</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingId ? 'Leave blank to keep current' : 'Password'}
                    className={styles.input}
                    required={!editingId}
                  />
                  <small>Minimum 8 characters</small>
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
                </div>
              </div>

              {isSuperAdmin && (
                <div className={styles.formGroup}>
                  <label>Department Access</label>
                  <div className={styles.departmentGrid}>
                    {DEPARTMENTS.map((dept) => (
                      <label key={dept.value} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(dept.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDepartments([...selectedDepartments, dept.value]);
                            } else {
                              setSelectedDepartments(
                                selectedDepartments.filter((d) => d !== dept.value)
                              );
                            }
                          }}
                          className={styles.checkbox}
                        />
                        {dept.label}
                      </label>
                    ))}
                  </div>
                  <small>Select one or more departments this user can access</small>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="avatar">Avatar URL</label>
                <input
                  id="avatar"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short bio about the user"
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" disabled={saving} className={styles.saveButton}>
                  {saving ? 'Saving...' : editingId ? 'Update User' : 'Add User'}
                </button>
                <button type="button" onClick={cancelEdit} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={styles.tableCard}>
          {users.length === 0 ? (
            <div className={styles.empty}>
              <p>No users yet.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  {isSuperAdmin && <th>Departments</th>}
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.userCell}>
                      <div className={styles.userInfo}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className={styles.avatar} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {user.name[0].toUpperCase()}
                          </div>
                        )}
                        <span className={styles.userName}>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <RoleBadges
                        userRole={user.role}
                        membershipTier={user.membershipTier}
                      />
                    </td>
                    {isSuperAdmin && (
                      <td>
                        {user.departments && user.departments.length > 0 ? (
                          <div className={styles.departmentBadges}>
                            {user.departments.map((dept) => {
                              const deptInfo = DEPARTMENTS.find((d) => d.value === dept);
                              return (
                                <span key={dept} className={styles.deptBadge}>
                                  {deptInfo?.label || dept}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className={styles.noDepartments}>No departments</span>
                        )}
                      </td>
                    )}
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className={styles.actions}>
                      <button
                        onClick={() => handleEdit(user)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className={styles.deleteButton}
                        disabled={user.id === session.user.id}
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
