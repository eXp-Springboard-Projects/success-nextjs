import { useEffect, useState } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './Lists.module.css';

interface List {
  id: string;
  name: string;
  description: string | null;
  type: 'STATIC' | 'DYNAMIC';
  filters: any;
  memberCount: number;
  updatedAt: string;
}

interface Member {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  addedAt: string;
}

export default function ListDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [list, setList] = useState<List | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedList, setEditedList] = useState({ name: '', description: '' });
  const [addContactEmail, setAddContactEmail] = useState('');
  const [previewCount, setPreviewCount] = useState(0);
  const perPage = 20;

  useEffect(() => {
    if (id) {
      fetchList();
      fetchMembers();
    }
  }, [id, page]);

  useEffect(() => {
    if (list?.type === 'DYNAMIC' && id) {
      fetchPreview();
    }
  }, [list?.type, id]);

  const fetchList = async () => {
    try {
      const res = await fetch(`/api/admin/crm/lists/${id}`);
      const data = await res.json();
      setList(data);
      setEditedList({ name: data.name, description: data.description || '' });
    } catch (error) {
      console.error('Failed to fetch list:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(
        `/api/admin/crm/lists/${id}/members?page=${page}&perPage=${perPage}&search=${search}`
      );
      const data = await res.json();
      setMembers(data.members);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    try {
      const res = await fetch(`/api/admin/crm/lists/${id}/preview`);
      const data = await res.json();
      setPreviewCount(data.count);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/admin/crm/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedList),
      });
      if (res.ok) {
        await fetchList();
        setEditMode(false);
      }
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  const handleAddContact = async () => {
    if (!addContactEmail.trim()) return;
    try {
      const res = await fetch(`/api/admin/crm/lists/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addContactEmail }),
      });
      if (res.ok) {
        setAddContactEmail('');
        fetchMembers();
        fetchList();
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleRemoveMember = async (contactId: string) => {
    try {
      await fetch(`/api/admin/crm/lists/${id}/members/${contactId}`, {
        method: 'DELETE',
      });
      fetchMembers();
      fetchList();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/admin/crm/lists/${id}/members?export=true`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${list?.name || 'list'}-members.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (!list) {
    return (
      <DepartmentLayout
        currentDepartment={Department.SUPER_ADMIN}
        pageTitle="Loading..."
        description=""
      >
        <div className={styles.emptyState}>Loading...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout
      currentDepartment={Department.SUPER_ADMIN}
      pageTitle={list.name}
      description={list.description || ''}
    >
      <div className={styles.dashboard}>
        {/* Back Link */}
        <Link href="/admin/crm/lists" className={styles.backLink}>
          ← Back to Lists
        </Link>

        {/* List Header */}
        <div className={styles.section}>
          <div className={styles.listDetailHeader}>
            <div className={styles.listDetailInfo}>
              {editMode ? (
                <div className={styles.editForm}>
                  <input
                    type="text"
                    value={editedList.name}
                    onChange={(e) => setEditedList({ ...editedList, name: e.target.value })}
                    className={styles.editInput}
                    placeholder="List name"
                  />
                  <textarea
                    value={editedList.description}
                    onChange={(e) =>
                      setEditedList({ ...editedList, description: e.target.value })
                    }
                    className={styles.editTextarea}
                    placeholder="Description"
                    rows={3}
                  />
                  <div className={styles.editActions}>
                    <button onClick={handleUpdate} className={styles.saveButton}>
                      Save
                    </button>
                    <button onClick={() => setEditMode(false)} className={styles.cancelButton}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.listDetailTitleRow}>
                    <h2 className={styles.listDetailTitle}>{list.name}</h2>
                    <span className={styles.typeBadge} data-type={list.type.toLowerCase()}>
                      {list.type === 'STATIC' ? 'Static' : 'Dynamic'}
                    </span>
                  </div>
                  {list.description && (
                    <p className={styles.listDetailDescription}>{list.description}</p>
                  )}
                  <div className={styles.listDetailStats}>
                    <div className={styles.detailStat}>
                      <span className={styles.detailStatValue}>{list.memberCount}</span>
                      <span className={styles.detailStatLabel}>Members</span>
                    </div>
                    {list.type === 'DYNAMIC' && (
                      <div className={styles.detailStat}>
                        <span className={styles.detailStatValue}>{previewCount}</span>
                        <span className={styles.detailStatLabel}>Matching Contacts</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {!editMode && (
              <div className={styles.listDetailActions}>
                <button onClick={() => setEditMode(true)} className={styles.editButton}>
                  Edit
                </button>
                <button onClick={handleExport} className={styles.exportButton}>
                  Export CSV
                </button>
              </div>
            )}
          </div>

          {/* Filter Display for Dynamic Lists */}
          {list.type === 'DYNAMIC' && list.filters && (
            <div className={styles.filtersDisplay}>
              <h3 className={styles.filtersTitle}>Active Filters:</h3>
              <div className={styles.filtersList}>
                {list.filters.conditions?.map((condition: any, idx: number) => (
                  <div key={idx} className={styles.filterChip}>
                    <strong>{condition.field}</strong> {condition.operator} {condition.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Contact for Static Lists */}
          {list.type === 'STATIC' && (
            <div className={styles.addContactForm}>
              <input
                type="email"
                value={addContactEmail}
                onChange={(e) => setAddContactEmail(e.target.value)}
                placeholder="Enter contact email to add..."
                className={styles.addContactInput}
              />
              <button onClick={handleAddContact} className={styles.addContactButton}>
                Add Contact
              </button>
            </div>
          )}
        </div>

        {/* Members Table */}
        <div className={styles.section}>
          <div className={styles.tableHeader}>
            <h3 className={styles.sectionTitle}>Members</h3>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className={styles.searchInput}
            />
          </div>

          {loading ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : members.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <div>No members in this list</div>
            </div>
          ) : (
            <>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Added</th>
                      {list.type === 'STATIC' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.email}</td>
                        <td>
                          {member.firstName || member.lastName
                            ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                            : '-'}
                        </td>
                        <td>
                          <span className={styles.statusBadge} data-status={member.status}>
                            {member.status}
                          </span>
                        </td>
                        <td>{new Date(member.addedAt).toLocaleDateString()}</td>
                        {list.type === 'STATIC' && (
                          <td>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className={styles.removeButton}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > perPage && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className={styles.paginationButton}
                  >
                    Previous
                  </button>
                  <span className={styles.paginationInfo}>
                    Page {page} of {Math.ceil(total / perPage)}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / perPage)}
                    className={styles.paginationButton}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUPER_ADMIN);
