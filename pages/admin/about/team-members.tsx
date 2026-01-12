import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from '../posts/AdminPosts.module.css';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  linkedIn?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TeamMembersAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    image: '',
    linkedIn: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTeamMembers();
    }
  }, [session]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/team-members');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/admin/team-members';
      const method = editingMember ? 'PUT' : 'POST';
      const body = editingMember
        ? { ...formData, id: editingMember.id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchTeamMembers();
        resetForm();
        alert(editingMember ? 'Team member updated!' : 'Team member added!');
      } else {
        alert('Failed to save team member');
      }
    } catch (error) {
      alert('Failed to save team member');
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      title: member.title,
      bio: member.bio,
      image: member.image,
      linkedIn: member.linkedIn || '',
      displayOrder: member.displayOrder,
      isActive: member.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch('/api/admin/team-members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        await fetchTeamMembers();
        alert('Team member deleted!');
      } else {
        alert('Failed to delete team member');
      }
    } catch (error) {
      alert('Failed to delete team member');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      bio: '',
      image: '',
      linkedIn: '',
      displayOrder: 0,
      isActive: true,
    });
    setEditingMember(null);
    setShowForm(false);
  };

  const moveUp = async (member: TeamMember) => {
    const currentIndex = teamMembers.findIndex(m => m.id === member.id);
    if (currentIndex === 0) return;

    const prevMember = teamMembers[currentIndex - 1];

    // Swap display orders
    await updateDisplayOrder(member.id, prevMember.displayOrder);
    await updateDisplayOrder(prevMember.id, member.displayOrder);
    await fetchTeamMembers();
  };

  const moveDown = async (member: TeamMember) => {
    const currentIndex = teamMembers.findIndex(m => m.id === member.id);
    if (currentIndex === teamMembers.length - 1) return;

    const nextMember = teamMembers[currentIndex + 1];

    // Swap display orders
    await updateDisplayOrder(member.id, nextMember.displayOrder);
    await updateDisplayOrder(nextMember.id, member.displayOrder);
    await fetchTeamMembers();
  };

  const updateDisplayOrder = async (id: string, displayOrder: number) => {
    const member = teamMembers.find(m => m.id === id);
    if (!member) return;

    await fetch('/api/admin/team-members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...member, displayOrder }),
    });
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading team members...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.postsPage}>
        <div className={styles.header}>
          <div>
            <h1>About Us - Team Members</h1>
            <p className={styles.subtitle}>Manage team member photos and bios</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={styles.newButton}
          >
            {showForm ? 'Cancel' : 'Add Team Member'}
          </button>
        </div>

        {showForm && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>
              {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Bio *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  required
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    style={{
                      marginTop: '0.5rem',
                      maxWidth: '150px',
                      borderRadius: '8px'
                    }}
                  />
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                  placeholder="https://www.linkedin.com/in/username"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active (show on About page)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    background: '#000',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {editingMember ? 'Update' : 'Add'} Team Member
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: '#f0f0f0',
                    color: '#333',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th style={{ width: '80px' }}>Photo</th>
                <th>Name</th>
                <th>Title</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member, index) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => moveUp(member)}
                        disabled={index === 0}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '12px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.5 : 1
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(member)}
                        disabled={index === teamMembers.length - 1}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '12px',
                          cursor: index === teamMembers.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === teamMembers.length - 1 ? 0.5 : 1
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <img
                      src={member.image}
                      alt={member.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  </td>
                  <td>{member.name}</td>
                  <td>{member.title}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: member.isActive ? '#e8f5e9' : '#ffebee',
                      color: member.isActive ? '#2e7d32' : '#c62828'
                    }}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(member)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#f0f0f0',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#ffebee',
                          color: '#c62828',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {teamMembers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            No team members yet. Click "Add Team Member" to get started.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
