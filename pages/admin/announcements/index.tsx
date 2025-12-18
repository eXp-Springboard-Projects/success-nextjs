import { useState, useEffect } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { GetServerSidePropsContext } from 'next';
import styles from './Announcements.module.css';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface AnnouncementsPageProps {
  userDepartment: Department;
}

export default function AnnouncementsPage({ userDepartment }: AnnouncementsPageProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete announcement "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAnnouncements(announcements.filter(a => a.id !== id));
        alert('✓ Announcement deleted successfully');
      } else {
        const data = await res.json();
        alert(`✗ Failed to delete: ${data.error}`);
      }
    } catch (error) {
      alert('✗ Failed to delete announcement');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      alert('✗ Failed to update announcement');
    }
  };

  const getStatusBadge = (announcement: Announcement) => {
    if (!announcement.isActive) {
      return <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactive</span>;
    }
    if (announcement.expiresAt) {
      const expiresAt = new Date(announcement.expiresAt);
      const now = new Date();
      if (expiresAt < now) {
        return <span className={`${styles.badge} ${styles.badgeExpired}`}>Expired</span>;
      }
    }
    return <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>;
  };

  return (
    <DepartmentLayout
      currentDepartment={userDepartment}
      pageTitle="Announcements"
      description="Company-wide announcements and updates"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Announcements</h1>
            <p>Manage company-wide announcements and updates</p>
          </div>
          <Link href="/admin/announcements/new" className={styles.createButton}>
            + New Announcement
          </Link>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📢</div>
            <div>No announcements yet</div>
            <Link href="/admin/announcements/new" className={styles.createButton}>
              Create Your First Announcement
            </Link>
          </div>
        ) : (
          <div className={styles.announcementsList}>
            {announcements.map((announcement) => (
              <div key={announcement.id} className={styles.announcementCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.title}>{announcement.title}</h3>
                  {getStatusBadge(announcement)}
                </div>
                <div
                  className={styles.content}
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />
                <div className={styles.meta}>
                  <span>Posted by {announcement.createdBy}</span>
                  <span>•</span>
                  <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                  {announcement.expiresAt && (
                    <>
                      <span>•</span>
                      <span>Expires {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                <div className={styles.actions}>
                  <Link href={`/admin/announcements/${announcement.id}/edit`} className={styles.actionButton}>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                    className={styles.actionButton}
                  >
                    {announcement.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id, announcement.title)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const result = await requireDepartmentAuth(Department.CUSTOMER_SERVICE)(context);

  if ('redirect' in result) {
    return result;
  }

  if ('notFound' in result) {
    return result;
  }

  const userDepartment = (result.props as any).session?.user?.primaryDepartment || Department.CUSTOMER_SERVICE;

  return {
    props: {
      userDepartment,
    },
  };
}
