import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  eventType: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  location: string;
  thumbnail: string;
  hostName: string;
  hostBio: string;
  hostImage: string;
  maxAttendees: number | null;
  currentAttendees: number;
  isRegistered: boolean;
  registrationStatus: string | null;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showUpcoming, setShowUpcoming] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/events');
    } else if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status, typeFilter, showUpcoming]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('eventType', typeFilter);
      if (showUpcoming) params.append('upcoming', 'true');

      const response = await fetch(`/api/dashboard/events?${params}`);

      if (response.status === 403) {
        router.push('/subscribe?error=subscription_required');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      const response = await fetch('/api/dashboard/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (response.ok) {
        fetchEvents(); // Refresh events
        const result = await response.json();
        if (result.message) {
          alert(result.message);
        }
      }
    } catch (error) {
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/events?eventId=${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEvents(); // Refresh events
      }
    } catch (error) {
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const eventTypes = ['WEBINAR', 'WORKSHOP', 'QA_SESSION', 'NETWORKING', 'MASTERCLASS', 'CONFERENCE'];

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Events Calendar - SUCCESS+ Dashboard</title>
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Link href="/dashboard">
              <img src="/success-logo.png" alt="SUCCESS" />
            </Link>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button><span className={styles.icon}>📊</span> Dashboard</button>
            </Link>
            <Link href="/dashboard/premium">
              <button><span className={styles.icon}>⭐</span> Premium Content</button>
            </Link>
            <Link href="/dashboard/courses">
              <button><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resources</button>
            </Link>
            <Link href="/dashboard/labs">
              <button><span className={styles.icon}>🔬</span> Success Labs</button>
            </Link>
            <Link href="/dashboard/events">
              <button className={styles.active}><span className={styles.icon}>📅</span> Events</button>
            </Link>
            <Link href="/dashboard/videos">
              <button><span className={styles.icon}>🎥</span> Videos</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcasts</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazines</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Events Calendar</h1>
            <p className={styles.subtitle}>Exclusive SUCCESS+ member events and webinars</p>
          </div>

          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <button
                className={showUpcoming ? styles.activeFilter : ''}
                onClick={() => setShowUpcoming(true)}
              >
                Upcoming Events
              </button>
              <button
                className={!showUpcoming ? styles.activeFilter : ''}
                onClick={() => setShowUpcoming(false)}
              >
                All Events
              </button>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="all">All Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.eventsList}>
            {events.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <div className={styles.eventDate}>
                  <div className={styles.month}>
                    {new Date(event.startDateTime).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className={styles.day}>
                    {new Date(event.startDateTime).getDate()}
                  </div>
                </div>

                {event.thumbnail && (
                  <div className={styles.eventThumbnail}>
                    <img src={event.thumbnail} alt={event.title} />
                  </div>
                )}

                <div className={styles.eventContent}>
                  <div className={styles.eventType}>{event.eventType.replace(/_/g, ' ')}</div>
                  <h3>{event.title}</h3>
                  <p className={styles.eventDescription}>{event.description}</p>

                  <div className={styles.eventDetails}>
                    <div className={styles.eventTime}>
                      <span>{formatDate(event.startDateTime)}</span>
                      <span>{formatTime(event.startDateTime)}</span>
                      {event.timezone && <span>{event.timezone}</span>}
                    </div>

                    {event.hostName && (
                      <div className={styles.eventHost}>
                        {event.hostImage && (
                          <img src={event.hostImage} alt={event.hostName} />
                        )}
                        <span>Host: {event.hostName}</span>
                      </div>
                    )}

                    {event.maxAttendees && (
                      <div className={styles.eventCapacity}>
                        {event.currentAttendees} / {event.maxAttendees} registered
                      </div>
                    )}
                  </div>

                  <div className={styles.eventActions}>
                    {event.isRegistered ? (
                      <>
                        <span className={styles.registeredBadge}>
                          {event.registrationStatus === 'WAITLISTED' ? 'Waitlisted' : 'Registered'}
                        </span>
                        {event.location && (
                          <a
                            href={event.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.joinBtn}
                          >
                            Join Event
                          </a>
                        )}
                        <button
                          className={styles.cancelBtn}
                          onClick={() => handleCancelRegistration(event.id)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.registerBtn}
                        onClick={() => handleRegister(event.id)}
                        disabled={
                          event.maxAttendees !== null &&
                          event.currentAttendees >= event.maxAttendees
                        }
                      >
                        {event.maxAttendees && event.currentAttendees >= event.maxAttendees
                          ? 'Join Waitlist'
                          : 'Register'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {events.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <p>No events found matching your filters.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
