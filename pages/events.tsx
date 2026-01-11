import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from './events.module.css';

const upcomingEvents = [
  {
    id: '1',
    title: 'Leadership Summit 2025',
    date: '2025-02-15',
    time: '10:00 AM PST',
    type: 'Webinar',
    description: 'Join us for an exclusive leadership summit featuring top executives and thought leaders.',
    registrationUrl: 'https://mysuccessplus.com',
  },
  {
    id: '2',
    title: 'Goal Setting Workshop',
    date: '2025-02-20',
    time: '2:00 PM PST',
    type: 'Workshop',
    description: 'Learn proven strategies to set and achieve your most ambitious goals.',
    registrationUrl: 'https://mysuccessplus.com',
  },
];

const pastEvents = [
  {
    id: '3',
    title: 'Productivity Masterclass',
    date: '2025-01-10',
    time: '1:00 PM PST',
    type: 'Masterclass',
    description: 'Recorded session available for members.',
    recordingUrl: 'https://mysuccessplus.com',
  },
];

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <Layout>
      <SEO
        title="Events - SUCCESS+"
        description="Join exclusive webinars, workshops, and community events"
        url="https://www.success.com/events"
      />

      <div className={styles.eventsPage}>
        <header className={styles.hero}>
          <h1>SUCCESS+ Events</h1>
          <p>Connect, learn, and grow with our community</p>
        </header>

        <div className={styles.container}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={activeTab === 'upcoming' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Events ({upcomingEvents.length})
            </button>
            <button
              className={activeTab === 'past' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('past')}
            >
              Past Events ({pastEvents.length})
            </button>
          </div>

          {/* Events List */}
          <div className={styles.eventsList}>
            {activeTab === 'upcoming' ? (
              upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className={styles.eventCard}>
                    <div className={styles.eventType}>{event.type}</div>
                    <div className={styles.eventContent}>
                      <h3>{event.title}</h3>
                      <div className={styles.eventMeta}>
                        <span className={styles.eventDate}>
                          📅 {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className={styles.eventTime}>🕐 {event.time}</span>
                      </div>
                      <p className={styles.eventDescription}>{event.description}</p>
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.registerButton}
                      >
                        Register Now
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noEvents}>
                  <p>No upcoming events at this time. Check back soon!</p>
                </div>
              )
            ) : (
              pastEvents.map((event) => (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventType}>{event.type}</div>
                  <div className={styles.eventContent}>
                    <h3>{event.title}</h3>
                    <div className={styles.eventMeta}>
                      <span className={styles.eventDate}>
                        📅 {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className={styles.eventTime}>🕐 {event.time}</span>
                    </div>
                    <p className={styles.eventDescription}>{event.description}</p>
                    <a
                      href={event.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.watchButton}
                    >
                      Watch Recording
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
