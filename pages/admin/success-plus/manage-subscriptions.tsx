import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './SuccessPlus.module.css';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipTier: string;
  membershipStatus: string;
  trialEndsAt: string | null;
  joinDate: string;
}

export default function ManageSubscriptions() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch('/api/admin/success-plus/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateMemberSubscription(memberId: string) {
    try {
      const res = await fetch(`/api/admin/success-plus/members/${memberId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialEndsAt: expirationDate || null,
          membershipTier: tier,
          membershipStatus: status,
        }),
      });

      if (res.ok) {
        alert('Subscription updated successfully!');
        setEditingMember(null);
        fetchMembers();
      } else {
        const error = await res.json();
        alert(`Failed to update: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to update subscription');
    }
  }

  function startEditing(member: Member) {
    setEditingMember(member.id);
    setTier(member.membershipTier);
    setStatus(member.membershipStatus);
    setExpirationDate(member.trialEndsAt ? new Date(member.trialEndsAt).toISOString().split('T')[0] : '');
  }

  const filteredMembers = members.filter((m) =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Manage Subscriptions"
      description="Update member subscription tiers and expiration dates"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Manage Member Subscriptions</h1>
          <p>Update subscription tiers, status, and renewal/expiration dates</p>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>Loading members...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Expiration/Renewal</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>{member.firstName} {member.lastName}</td>
                    <td>{member.email}</td>
                    <td>
                      {editingMember === member.id ? (
                        <select
                          value={tier}
                          onChange={(e) => setTier(e.target.value)}
                          className={styles.select}
                        >
                          <option value="Free">Free</option>
                          <option value="Customer">Customer</option>
                          <option value="SUCCESSPlus">SUCCESS+</option>
                          <option value="VIP">VIP</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                      ) : (
                        <span className={styles[`tier-${member.membershipTier.toLowerCase()}`]}>
                          {member.membershipTier}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingMember === member.id ? (
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className={styles.select}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Expired">Expired</option>
                        </select>
                      ) : (
                        <span className={styles[`status-${member.membershipStatus.toLowerCase()}`]}>
                          {member.membershipStatus}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingMember === member.id ? (
                        <input
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          className={styles.dateInput}
                        />
                      ) : member.trialEndsAt ? (
                        new Date(member.trialEndsAt).toLocaleDateString()
                      ) : (
                        <span style={{ color: '#999' }}>No expiration</span>
                      )}
                    </td>
                    <td>{new Date(member.joinDate).toLocaleDateString()}</td>
                    <td>
                      {editingMember === member.id ? (
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => updateMemberSubscription(member.id)}
                            className={styles.saveButton}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMember(null)}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(member)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMembers.length === 0 && (
              <div className={styles.emptyState}>
                <p>No members found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
