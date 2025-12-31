import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Users } from 'lucide-react';
import styles from './ContentManager.module.css';

interface Event {
  id: string;
  title: string;
  description: string;
  speaker: string;
  date: string;
  time: string;
  duration: string;
  type: 'Virtual' | 'In-Person' | 'Hybrid';
  location?: string;
  thumbnail?: string;
  isPublished: boolean;
  registeredCount: number;
  capacity: number;
  createdAt: string;
}

export default function EventsManager() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    // TODO: Replace with actual API call
    // Mock data for now
    setTimeout(() => {
      setEvents([
        {
          id: '1',
          title: 'SUCCESS Summit 2025',
          description: 'Annual leadership and success conference',
          speaker: 'John Maxwell',
          date: '2025-03-15',
          time: '9:00 AM EST',
          duration: '3 days',
          type: 'Hybrid',
          location: 'Dallas, TX',
          isPublished: true,
          registeredCount: 487,
          capacity: 500,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Entrepreneurship Workshop',
          description: 'Building a sustainable business from scratch',
          speaker: 'Sara Blakely',
          date: '2025-02-20',
          time: '2:00 PM EST',
          duration: '2 hours',
          type: 'Virtual',
          isPublished: true,
          registeredCount: 234,
          capacity: 300,
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    // TODO: API call to toggle publish status
    setEvents(events.map(e =>
      e.id === id ? { ...e, isPublished: !currentStatus } : e
    ));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    // TODO: API call to delete
    setEvents(events.filter(e => e.id !== id));
  };

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'published') return e.isPublished;
    if (filter === 'draft') return !e.isPublished;
    return true;
  });

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Events Manager"
      description="Manage SUCCESS+ events and workshops"
    >
      <div className={styles.container}>
        {/* Header Actions */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard/events" className={styles.previewButton}>
              <Eye size={16} />
              Preview as Member
            </Link>
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={() => router.push('/admin/success-plus/events/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Add New Event
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? styles.filterActive : styles.filterButton}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={filter === 'published' ? styles.filterActive : styles.filterButton}
          >
            Published ({events.filter(e => e.isPublished).length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={filter === 'draft' ? styles.filterActive : styles.filterButton}
          >
            Drafts ({events.filter(e => !e.isPublished).length})
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Calendar /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{events.length}</div>
              <div className={styles.statLabel}>Total Events</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Users /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {events.reduce((sum, e) => sum + e.registeredCount, 0)}
              </div>
              <div className={styles.statLabel}>Total Registrations</div>
            </div>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className={styles.loading}>Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <h3>No events found</h3>
            <p>Get started by creating your first event</p>
            <button
              onClick={() => router.push('/admin/success-plus/events/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Create Event
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Speaker</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div className={styles.courseCell}>
                        <div className={styles.courseThumbnail}>
                          {event.thumbnail ? (
                            <img src={event.thumbnail} alt={event.title} />
                          ) : (
                            <div className={styles.placeholderIcon}>📅</div>
                          )}
                        </div>
                        <div>
                          <div className={styles.courseTitle}>{event.title}</div>
                          <div className={styles.courseCategory}>{event.location || 'Online'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{event.speaker}</td>
                    <td>
                      <div>{new Date(event.date).toLocaleDateString()}</div>
                      <div className={styles.courseCategory}>{event.time}</div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${event.type}`]}`}>
                        {event.type}
                      </span>
                    </td>
                    <td>{event.duration}</td>
                    <td>{event.registeredCount} / {event.capacity}</td>
                    <td>
                      <span className={`${styles.badge} ${event.isPublished ? styles.badgeSuccess : styles.badgeDraft}`}>
                        {event.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => router.push(`/admin/success-plus/events/${event.id}/edit`)}
                          className={styles.iconButton}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(event.id, event.isPublished)}
                          className={styles.iconButton}
                          title={event.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {event.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
