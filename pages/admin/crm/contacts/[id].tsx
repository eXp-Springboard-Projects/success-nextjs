import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import EmailComposeModal from '@/components/admin/crm/EmailComposeModal';
import styles from './ContactDetail.module.css';

type Tab = 'overview' | 'activity' | 'emails' | 'notes';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  email_status: string;
  source: string;
  custom_fields: Record<string, any>;
  tags: string[];
  lists: string[];
  total_emails_sent: number;
  total_opens: number;
  total_clicks: number;
  last_email_sent: string | null;
  last_email_opened: string | null;
  created_at: string;
  activities: Activity[];
  notes: Note[];
  emailSends: EmailSend[];
}

interface Activity {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface Note {
  id: string;
  staff_name: string;
  note: string;
  created_at: string;
}

interface EmailSend {
  id: string;
  subject: string;
  status: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

export default function ContactDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    status: '',
  });
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchContact();
    }
  }, [id]);

  const fetchContact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/contacts/${id}`);
      const data = await res.json();
      setContact(data);
      setEditForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        status: data.status || '',
      });
      setCustomFields(data.custom_fields || {});
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/admin/crm/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, customFields }),
      });

      if (res.ok) {
        setEditing(false);
        fetchContact();
      }
    } catch (error) {
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !contact) return;

    try {
      const res = await fetch(`/api/admin/crm/contacts/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag.trim() }),
      });

      if (res.ok) {
        setNewTag('');
        fetchContact();
      }
    } catch (error) {
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      const res = await fetch(`/api/admin/crm/contacts/${id}/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchContact();
      }
    } catch (error) {
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`/api/admin/crm/contacts/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });

      if (res.ok) {
        setNewNote('');
        fetchContact();
      }
    } catch (error) {
    }
  };

  const handleAddCustomField = () => {
    if (!newFieldKey.trim()) return;
    setCustomFields({ ...customFields, [newFieldKey]: newFieldValue });
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleRemoveCustomField = (key: string) => {
    const updated = { ...customFields };
    delete updated[key];
    setCustomFields(updated);
  };

  if (loading) {
    return (
      <DepartmentLayout
        currentDepartment={Department.CUSTOMER_SERVICE}
        pageTitle="Loading..."
        description=""
      >
        <div className={styles.loading}>Loading contact...</div>
      </DepartmentLayout>
    );
  }

  if (!contact) {
    return (
      <DepartmentLayout
        currentDepartment={Department.CUSTOMER_SERVICE}
        pageTitle="Not Found"
        description=""
      >
        <div className={styles.error}>Contact not found</div>
      </DepartmentLayout>
    );
  }

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'No Name';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle={fullName}
      description={contact.email}
    >
      <div className={styles.container}>
        {/* Back Link */}
        <Link href="/admin/crm/contacts" className={styles.backLink}>
          ← Back to Contacts
        </Link>

        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.profileLeft}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.profileInfo}>
              {editing ? (
                <div className={styles.editForm}>
                  <div className={styles.formRow}>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      placeholder="First Name"
                      className={styles.input}
                    />
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      placeholder="Last Name"
                      className={styles.input}
                    />
                  </div>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Email"
                    className={styles.input}
                  />
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Phone"
                    className={styles.input}
                  />
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="Company"
                    className={styles.input}
                  />
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={styles.select}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              ) : (
                <>
                  <h1 className={styles.profileName}>{fullName}</h1>
                  <div className={styles.profileDetails}>
                    <span>✉️ {contact.email}</span>
                    {contact.phone && <span>📞 {contact.phone}</span>}
                    {contact.company && <span>🏢 {contact.company}</span>}
                  </div>
                  <div className={styles.badges}>
                    <span className={`${styles.badge} ${styles[`badge${contact.status}`]}`}>
                      {contact.status}
                    </span>
                    {contact.email_status && contact.email_status !== 'subscribed' && (
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>
                        {contact.email_status}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={styles.profileRight}>
            {editing ? (
              <>
                <button onClick={handleSave} className={styles.primaryButton}>
                  Save
                </button>
                <button onClick={() => setEditing(false)} className={styles.secondaryButton}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowEmailModal(true)} className={styles.primaryButton}>
                  Send Email
                </button>
                <button onClick={() => setEditing(true)} className={styles.secondaryButton}>
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? styles.tabActive : styles.tab}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={activeTab === 'activity' ? styles.tabActive : styles.tab}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={activeTab === 'emails' ? styles.tabActive : styles.tab}
          >
            Emails
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={activeTab === 'notes' ? styles.tabActive : styles.tab}
          >
            Notes ({contact.notes?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              {/* Email Stats */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Email Statistics</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{contact.total_emails_sent || 0}</div>
                    <div className={styles.statLabel}>Total Sent</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{contact.total_opens || 0}</div>
                    <div className={styles.statLabel}>Opens</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{contact.total_clicks || 0}</div>
                    <div className={styles.statLabel}>Clicks</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>
                      {contact.last_email_opened
                        ? new Date(contact.last_email_opened).toLocaleDateString()
                        : 'Never'}
                    </div>
                    <div className={styles.statLabel}>Last Opened</div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Tags</h2>
                <div className={styles.tagsContainer}>
                  {contact.tags && contact.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className={styles.tagRemove}>
                        ×
                      </button>
                    </span>
                  ))}
                  <div className={styles.addTag}>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tag..."
                      className={styles.tagInput}
                    />
                    <button onClick={handleAddTag} className={styles.addButton}>+</button>
                  </div>
                </div>
              </div>

              {/* Lists */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Lists</h2>
                <div className={styles.lists}>
                  {contact.lists && contact.lists.length > 0 ? (
                    contact.lists.map((list) => (
                      <span key={list} className={styles.listBadge}>{list}</span>
                    ))
                  ) : (
                    <p className={styles.empty}>Not in any lists</p>
                  )}
                </div>
              </div>

              {/* Custom Fields */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Custom Fields</h2>
                <div className={styles.customFields}>
                  {Object.entries(customFields).map(([key, value]) => (
                    <div key={key} className={styles.customField}>
                      <div className={styles.fieldKey}>{key}</div>
                      <div className={styles.fieldValue}>{String(value)}</div>
                      {editing && (
                        <button
                          onClick={() => handleRemoveCustomField(key)}
                          className={styles.fieldRemove}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {editing && (
                    <div className={styles.addField}>
                      <input
                        type="text"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        placeholder="Field name"
                        className={styles.fieldInput}
                      />
                      <input
                        type="text"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="Field value"
                        className={styles.fieldInput}
                      />
                      <button onClick={handleAddCustomField} className={styles.addButton}>
                        Add
                      </button>
                    </div>
                  )}
                  {Object.keys(customFields).length === 0 && !editing && (
                    <p className={styles.empty}>No custom fields</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className={styles.activity}>
              {contact.activities && contact.activities.length > 0 ? (
                <div className={styles.timeline}>
                  {contact.activities.map((activity) => (
                    <div key={activity.id} className={styles.timelineItem}>
                      <div className={styles.timelineIcon}>
                        {activity.type === 'email_sent' && '📧'}
                        {activity.type === 'email_opened' && '👁️'}
                        {activity.type === 'email_click' && '🖱️'}
                        {activity.type === 'contact_created' && '✨'}
                        {activity.type === 'contact_updated' && '✏️'}
                        {activity.type === 'unsubscribed' && '🚫'}
                      </div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineDescription}>{activity.description}</div>
                        <div className={styles.timelineDate}>
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No activity yet</p>
              )}
            </div>
          )}

          {activeTab === 'emails' && (
            <div className={styles.emails}>
              {contact.emailSends && contact.emailSends.length > 0 ? (
                <div className={styles.emailsList}>
                  {contact.emailSends.map((email) => (
                    <div key={email.id} className={styles.emailItem}>
                      <div className={styles.emailSubject}>{email.subject}</div>
                      <div className={styles.emailMeta}>
                        <span>Sent: {new Date(email.sent_at).toLocaleString()}</span>
                        {email.opened_at && (
                          <span className={styles.emailOpened}>
                            Opened: {new Date(email.opened_at).toLocaleString()}
                          </span>
                        )}
                        {email.clicked_at && (
                          <span className={styles.emailClicked}>
                            Clicked: {new Date(email.clicked_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className={`${styles.emailStatus} ${styles[`status${email.status}`]}`}>
                        {email.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No emails sent yet</p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className={styles.notes}>
              <div className={styles.addNoteSection}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className={styles.noteInput}
                  rows={3}
                />
                <button onClick={handleAddNote} className={styles.primaryButton}>
                  Add Note
                </button>
              </div>
              {contact.notes && contact.notes.length > 0 ? (
                <div className={styles.notesList}>
                  {contact.notes.map((note) => (
                    <div key={note.id} className={styles.noteItem}>
                      <div className={styles.noteHeader}>
                        <span className={styles.noteAuthor}>{note.staff_name}</span>
                        <span className={styles.noteDate}>
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.noteText}>{note.note}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No notes yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      <EmailComposeModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          fetchContact(); // Refresh to show new email in activity/notes
        }}
        recipientEmail={contact.email}
        recipientName={fullName}
        contactId={contact.id}
      />
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
