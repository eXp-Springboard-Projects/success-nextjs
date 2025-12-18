import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './AnnouncementBanner.module.css';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchActiveAnnouncement();
  }, []);

  const fetchActiveAnnouncement = async () => {
    try {
      const res = await fetch('/api/admin/announcements/active');
      if (res.ok) {
        const data = await res.json();
        if (data.announcement) {
          // Check if user has dismissed this announcement
          const dismissedIds = JSON.parse(
            localStorage.getItem('dismissedAnnouncements') || '[]'
          );
          if (!dismissedIds.includes(data.announcement.id)) {
            setAnnouncement(data.announcement);
          }
        }
      }
    } catch (error) {
    }
  };

  const handleDismiss = () => {
    if (!announcement) return;

    // Store dismissal in localStorage
    const dismissedIds = JSON.parse(
      localStorage.getItem('dismissedAnnouncements') || '[]'
    );
    dismissedIds.push(announcement.id);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedIds));

    setDismissed(true);
  };

  if (!announcement || dismissed) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.icon}>=�</div>
        <div className={styles.message}>
          <div className={styles.title}>{announcement.title}</div>
          <div
            className={styles.text}
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />
          <div className={styles.meta}>
            Posted by {announcement.createdBy} "{' '}
            {new Date(announcement.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <Link href="/admin/announcements" className={styles.viewAll}>
          View All
        </Link>
        <button onClick={handleDismiss} className={styles.dismiss}>
          
        </button>
      </div>
    </div>
  );
}
