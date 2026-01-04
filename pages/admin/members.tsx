import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import RoleBadges from '../../components/admin/RoleBadges';
import styles from './Members.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type MembershipTier = 'Free' | 'Customer' | 'SUCCESSPlus' | 'VIP' | 'Enterprise';
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'STAFF';
type PriorityLevel = 'Standard' | 'High' | 'VIP' | 'Enterprise';

interface Member {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipTier: MembershipTier;
  membershipStatus: string;
  totalSpent: number;
  lifetimeValue: number;
  createdAt: string;
  joinDate: string;
  tags?: string[];
  priorityLevel?: PriorityLevel;
  internalNotes?: string;
  subscription?: {
    status: string;
    currentPeriodEnd?: string;
    stripePriceId?: string;
    provider?: string;
  } | null;
  platformRole?: UserRole | null;
  isPlatformUser: boolean;
}

interface EditModalState {
  isOpen: boolean;
  member: Member | null;
}

export default function MembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editModal, setEditModal] = useState<EditModalState>({ isOpen: false, member: null });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tags: [] as string[],
    priorityLevel: 'Standard' as PriorityLevel,
    internalNotes: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchMembers();
    }
  }, [session]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      } else {
        console.error('Failed to fetch members:', await res.text());
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (member: Member) => {
    setEditModal({ isOpen: true, member });
    setEditForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      tags: member.tags || [],
      priorityLevel: member.priorityLevel || 'Standard',
      internalNotes: member.internalNotes || '',
    });
    setTagInput('');
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, member: null });
    setEditForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      tags: [],
      priorityLevel: 'Standard',
      internalNotes: '',
    });
  };

  const handleSave = async () => {
    if (!editModal.member) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${editModal.member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        showToast('Customer updated successfully', 'success');
        closeEditModal();
        fetchMembers();
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to update customer', 'error');
      }
    } catch (error) {
      showToast('Failed to update customer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addTag = () => {
    if (tagInput.trim() && !editForm.tags.includes(tagInput.trim())) {
      setEditForm({ ...editForm, tags: [...editForm.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setEditForm({ ...editForm, tags: editForm.tags.filter((t) => t !== tag) });
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading members...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  // Filter members based on membership status and search term
  const filteredMembers = members.filter((member) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && (member.membershipStatus === 'Active' || member.subscription?.status === 'ACTIVE')) ||
      (filter === 'inactive' && member.membershipStatus !== 'Active' && member.subscription?.status !== 'ACTIVE');

    const matchesSearch =
      searchTerm === '' ||
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const activeCount = members.filter(
    (m) => m.membershipStatus === 'Active' || m.subscription?.status === 'ACTIVE'
  ).length;
  const inactiveCount = members.length - activeCount;

  return (
    <AdminLayout>
      <div className={styles.membersPage}>
        <div className={styles.header}>
          <div>
            <h1>Customers</h1>
            <p className={styles.subtitle}>
              Members who have purchased products or subscriptions
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h3>Total Members</h3>
              <p className={styles.statNumber}>{members.length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <h3>Active Subscriptions</h3>
              <p className={styles.statNumber}>{activeCount}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏸️</div>
            <div className={styles.statContent}>
              <h3>Inactive/Pending</h3>
              <p className={styles.statNumber}>{inactiveCount}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <h3>MRR Estimate</h3>
              <p className={styles.statNumber}>${activeCount * 9.99}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={styles.controls}>
          <div className={styles.filters}>
            <button
              className={filter === 'all' ? styles.filterActive : styles.filterButton}
              onClick={() => setFilter('all')}
            >
              All ({members.length})
            </button>
            <button
              className={filter === 'active' ? styles.filterActive : styles.filterButton}
              onClick={() => setFilter('active')}
            >
              Active ({activeCount})
            </button>
            <button
              className={filter === 'inactive' ? styles.filterActive : styles.filterButton}
              onClick={() => setFilter('inactive')}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Members Table */}
        <div className={styles.tableContainer}>
          {filteredMembers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No members found</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Membership</th>
                  <th>Total Spent</th>
                  <th>Customer Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberAvatar}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{member.name}</strong>
                          {member.isPlatformUser && (
                            <div className={styles.platformIndicator}>
                              (Also has platform access)
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td>
                      <RoleBadges
                        memberTier={member.membershipTier}
                        platformRole={member.platformRole}
                      />
                    </td>
                    <td>${member.totalSpent.toFixed(2)}</td>
                    <td>
                      {new Date(member.joinDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/members/${member.id}`}
                          className={styles.actionButton}
                        >
                          View
                        </Link>
                        <button
                          onClick={() => openEditModal(member)}
                          className={styles.actionButtonEdit}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editModal.isOpen && editModal.member && (
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Customer</h2>
              <button onClick={closeEditModal} className={styles.modalClose}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={styles.input}
                    placeholder="Optional"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Priority Level</label>
                  <select
                    value={editForm.priorityLevel}
                    onChange={(e) => setEditForm({ ...editForm, priorityLevel: e.target.value as PriorityLevel })}
                    className={styles.select}
                  >
                    <option value="Standard">Standard</option>
                    <option value="High">High</option>
                    <option value="VIP">VIP</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Tags</label>
                  <div className={styles.tagInput}>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag and press Enter"
                      className={styles.input}
                    />
                    <button onClick={addTag} className={styles.addTagButton}>+</button>
                  </div>
                  <div className={styles.tags}>
                    {editForm.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                        <button onClick={() => removeTag(tag)} className={styles.removeTag}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroupFull}>
                  <label>Internal Notes</label>
                  <textarea
                    value={editForm.internalNotes}
                    onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                    className={styles.textarea}
                    rows={4}
                    placeholder="Internal notes visible only to admins..."
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={closeEditModal} className={styles.cancelButton} disabled={saving}>
                Cancel
              </button>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
