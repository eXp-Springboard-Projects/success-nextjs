import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from '../posts/AdminPosts.module.css';

interface HistoryItem {
  year: string;
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  linkedIn?: string;
  displayOrder: number;
  isActive: boolean;
}

interface AboutContent {
  heroVideoUrl: string;
  historyItems: HistoryItem[];
}

export default function AboutUsEditor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'history' | 'team'>('hero');

  // Hero video state
  const [heroVideoUrl, setHeroVideoUrl] = useState('');

  // History timeline state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [editingHistoryIndex, setEditingHistoryIndex] = useState<number | null>(null);
  const [historyForm, setHistoryForm] = useState({ year: '', description: '' });

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState({
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
      fetchAboutContent();
      fetchTeamMembers();
    }
  }, [session]);

  const fetchAboutContent = async () => {
    try {
      const res = await fetch('/api/admin/about-content');
      if (res.ok) {
        const data = await res.json();
        setHeroVideoUrl(data.heroVideoUrl || '');
        setHistoryItems(data.historyItems || []);
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/admin/team-members');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const saveAboutContent = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/about-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroVideoUrl,
          historyItems,
        }),
      });

      if (res.ok) {
        alert('About Us content saved successfully!');
      } else {
        alert('Failed to save content');
      }
    } catch (error) {
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // History item functions
  const addHistoryItem = () => {
    if (!historyForm.year || !historyForm.description) {
      alert('Please fill in both year and description');
      return;
    }

    if (editingHistoryIndex !== null) {
      const updated = [...historyItems];
      updated[editingHistoryIndex] = historyForm;
      setHistoryItems(updated);
      setEditingHistoryIndex(null);
    } else {
      setHistoryItems([...historyItems, historyForm]);
    }

    setHistoryForm({ year: '', description: '' });
  };

  const editHistoryItem = (index: number) => {
    setHistoryForm(historyItems[index]);
    setEditingHistoryIndex(index);
  };

  const deleteHistoryItem = (index: number) => {
    if (confirm('Delete this history item?')) {
      setHistoryItems(historyItems.filter((_, i) => i !== index));
    }
  };

  const moveHistoryItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= historyItems.length) return;

    const updated = [...historyItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setHistoryItems(updated);
  };

  // Team member functions
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/admin/team-members';
      const method = editingMember ? 'PUT' : 'POST';
      const body = editingMember
        ? { ...memberForm, id: editingMember.id }
        : memberForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchTeamMembers();
        resetMemberForm();
        alert(editingMember ? 'Team member updated!' : 'Team member added!');
      } else {
        alert('Failed to save team member');
      }
    } catch (error) {
      alert('Failed to save team member');
    }
  };

  const handleMemberEdit = (member: TeamMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      title: member.title,
      bio: member.bio,
      image: member.image,
      linkedIn: member.linkedIn || '',
      displayOrder: member.displayOrder,
      isActive: member.isActive,
    });
    setShowMemberForm(true);
  };

  const handleMemberDelete = async (id: string, name: string) => {
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

  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      title: '',
      bio: '',
      image: '',
      linkedIn: '',
      displayOrder: 0,
      isActive: true,
    });
    setEditingMember(null);
    setShowMemberForm(false);
  };

  const moveMember = async (member: TeamMember, direction: 'up' | 'down') => {
    const currentIndex = teamMembers.findIndex(m => m.id === member.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === teamMembers.length - 1)
    ) {
      return;
    }

    const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const otherMember = teamMembers[otherIndex];

    // Swap display orders
    await updateMemberDisplayOrder(member.id, otherMember.displayOrder);
    await updateMemberDisplayOrder(otherMember.id, member.displayOrder);
    await fetchTeamMembers();
  };

  const updateMemberDisplayOrder = async (id: string, displayOrder: number) => {
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
        <div className={styles.loading}>Loading...</div>
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
            <h1>About Us Page Editor</h1>
            <p className={styles.subtitle}>
              Manage all content on the About Us page
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a
              href="/about-us"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#000',
                border: '1px solid #ddd',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              👁️ Preview Page
            </a>
            {activeTab !== 'team' && (
              <button
                onClick={saveAboutContent}
                disabled={saving}
                className={styles.newButton}
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            borderBottom: '2px solid #f0f0f0',
          }}
        >
          <button
            onClick={() => setActiveTab('hero')}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'hero' ? '3px solid #000' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'hero' ? 600 : 400,
              fontSize: '16px',
            }}
          >
            🎬 Hero Video
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '3px solid #000' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'history' ? 600 : 400,
              fontSize: '16px',
            }}
          >
            📅 History Timeline
          </button>
          <button
            onClick={() => setActiveTab('team')}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'team' ? '3px solid #000' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'team' ? 600 : 400,
              fontSize: '16px',
            }}
          >
            👥 Team Members
          </button>
        </div>

        {/* Hero Video Tab */}
        {activeTab === 'hero' && (
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Hero Video</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Enter the Vimeo embed URL for the hero video at the top of the About Us page.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                }}
              >
                Vimeo Embed URL
              </label>
              <input
                type="url"
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                placeholder="https://player.vimeo.com/video/..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                Example: https://player.vimeo.com/video/1114343879?autoplay=1&loop=1&muted=1&background=1
              </small>
            </div>
            {heroVideoUrl && (
              <div style={{ marginTop: '2rem' }}>
                <h3>Preview:</h3>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={heroVideoUrl}
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    }}
                    title="Hero Video Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Timeline Tab */}
        {activeTab === 'history' && (
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>History Timeline</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Manage the history timeline items that appear in the carousel.
            </p>

            {/* Add/Edit Form */}
            <div
              style={{
                background: '#f9f9f9',
                padding: '1.5rem',
                borderRadius: '6px',
                marginBottom: '2rem',
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: '16px' }}>
                {editingHistoryIndex !== null ? 'Edit History Item' : 'Add New History Item'}
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 500,
                    }}
                  >
                    Year / Era
                  </label>
                  <input
                    type="text"
                    value={historyForm.year}
                    onChange={(e) =>
                      setHistoryForm({ ...historyForm, year: e.target.value })
                    }
                    placeholder="1897, 1930s, TODAY, etc."
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 500,
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    value={historyForm.description}
                    onChange={(e) =>
                      setHistoryForm({
                        ...historyForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={addHistoryItem}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {editingHistoryIndex !== null ? 'Update' : 'Add'} Item
                  </button>
                  {editingHistoryIndex !== null && (
                    <button
                      onClick={() => {
                        setHistoryForm({ year: '', description: '' });
                        setEditingHistoryIndex(null);
                      }}
                      style={{
                        padding: '0.5rem 1.5rem',
                        background: '#f0f0f0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* History Items List */}
            <div>
              <h3 style={{ fontSize: '16px' }}>
                Timeline Items ({historyItems.length})
              </h3>
              {historyItems.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                  No history items yet. Add your first one above.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {historyItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        background: '#f9f9f9',
                        padding: '1rem',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '18px' }}>
                          {item.year}
                        </h4>
                        <p style={{ margin: 0, color: '#666' }}>
                          {item.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => moveHistoryItem(index, 'up')}
                          disabled={index === 0}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '12px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            opacity: index === 0 ? 0.5 : 1,
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveHistoryItem(index, 'down')}
                          disabled={index === historyItems.length - 1}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '12px',
                            cursor:
                              index === historyItems.length - 1
                                ? 'not-allowed'
                                : 'pointer',
                            opacity: index === historyItems.length - 1 ? 0.5 : 1,
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => editHistoryItem(index)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(index)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#ffebee',
                            color: '#c62828',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Members Tab */}
        {activeTab === 'team' && (
          <div>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0 }}>Team Members</h2>
                <p style={{ color: '#666', marginTop: '0.5rem' }}>
                  Manage team member photos and bios
                </p>
              </div>
              <button
                onClick={() => setShowMemberForm(!showMemberForm)}
                className={styles.newButton}
              >
                {showMemberForm ? 'Cancel' : 'Add Team Member'}
              </button>
            </div>

            {showMemberForm && (
              <div
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '8px',
                  marginBottom: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <h2 style={{ marginTop: 0 }}>
                  {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                </h2>
                <form onSubmit={handleMemberSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                      }}
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      value={memberForm.name}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, name: e.target.value })
                      }
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                      }}
                    >
                      Title *
                    </label>
                    <input
                      type="text"
                      value={memberForm.title}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, title: e.target.value })
                      }
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                      }}
                    >
                      Bio *
                    </label>
                    <textarea
                      value={memberForm.bio}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, bio: e.target.value })
                      }
                      required
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                      }}
                    >
                      Image URL *
                    </label>
                    <input
                      type="url"
                      value={memberForm.image}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, image: e.target.value })
                      }
                      required
                      placeholder="https://example.com/image.jpg"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                    {memberForm.image && (
                      <img
                        src={memberForm.image}
                        alt="Preview"
                        style={{
                          marginTop: '0.5rem',
                          maxWidth: '150px',
                          borderRadius: '8px',
                        }}
                      />
                    )}
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                      }}
                    >
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={memberForm.linkedIn}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, linkedIn: e.target.value })
                      }
                      placeholder="https://www.linkedin.com/in/username"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                      }}
                    >
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={memberForm.displayOrder}
                      onChange={(e) =>
                        setMemberForm({
                          ...memberForm,
                          displayOrder: parseInt(e.target.value),
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={memberForm.isActive}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            isActive: e.target.checked,
                          })
                        }
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
                        fontWeight: 500,
                      }}
                    >
                      {editingMember ? 'Update' : 'Add'} Team Member
                    </button>
                    <button
                      type="button"
                      onClick={resetMemberForm}
                      style={{
                        background: '#f0f0f0',
                        color: '#333',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 500,
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
                            onClick={() => moveMember(member, 'up')}
                            disabled={index === 0}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '12px',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                              opacity: index === 0 ? 0.5 : 1,
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveMember(member, 'down')}
                            disabled={index === teamMembers.length - 1}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '12px',
                              cursor:
                                index === teamMembers.length - 1
                                  ? 'not-allowed'
                                  : 'pointer',
                              opacity: index === teamMembers.length - 1 ? 0.5 : 1,
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
                            borderRadius: '8px',
                          }}
                        />
                      </td>
                      <td>{member.name}</td>
                      <td>{member.title}</td>
                      <td>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: member.isActive ? '#e8f5e9' : '#ffebee',
                            color: member.isActive ? '#2e7d32' : '#c62828',
                          }}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleMemberEdit(member)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#f0f0f0',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleMemberDelete(member.id, member.name)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#ffebee',
                              color: '#c62828',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
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
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#666',
                }}
              >
                No team members yet. Click "Add Team Member" to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
