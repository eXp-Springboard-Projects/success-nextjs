import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './WatchHistory.module.css';

interface WatchHistoryItem {
  id: string;
  contentType: string;
  contentId: string;
  contentTitle: string;
  contentUrl: string;
  thumbnail: string | null;
  duration: number | null;
  position: number;
  completed: boolean;
  lastWatchedAt: string;
  progressPercent: number;
}

export default function WatchHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'video' | 'podcast' | 'inProgress'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated') {
      fetchWatchHistory();
    }
  }, [status, filter]);

  const fetchWatchHistory = async () => {
    setLoading(true);
    try {
      let url = '/api/watch-history?limit=50';

      if (filter === 'video' || filter === 'podcast') {
        url += `&contentType=${filter}`;
      } else if (filter === 'inProgress') {
        url += '&onlyInProgress=true';
      }

      const res = await fetch(url);
      const data = await res.json();
      setHistory(data.watchHistory || []);
    } catch (error) {
      console.error('Failed to fetch watch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentType: string, contentId: string) => {
    if (!confirm('Remove this item from your watch history?')) return;

    try {
      const res = await fetch(`/api/watch-history/${contentType}/${contentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setHistory(history.filter(item => !(item.contentType === contentType && item.contentId === contentId)));
      }
    } catch (error) {
      console.error('Failed to delete watch history:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your watch history...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Watch & Listen History</h1>
          <p className={styles.subtitle}>Continue where you left off</p>
        </div>
        <Link href="/account" className={styles.backLink}>
          ← Back to Account
        </Link>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'video' ? styles.active : ''}`}
          onClick={() => setFilter('video')}
        >
          Videos
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'podcast' ? styles.active : ''}`}
          onClick={() => setFilter('podcast')}
        >
          Podcasts
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'inProgress' ? styles.active : ''}`}
          onClick={() => setFilter('inProgress')}
        >
          In Progress
        </button>
      </div>

      {/* Watch History List */}
      {history.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎬</div>
          <h2>No watch history yet</h2>
          <p>Start watching videos or listening to podcasts to build your history.</p>
        </div>
      ) : (
        <div className={styles.historyGrid}>
          {history.map((item) => (
            <div key={item.id} className={styles.historyCard}>
              <div className={styles.thumbnailWrapper}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.contentTitle} className={styles.thumbnail} />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    {item.contentType === 'video' ? '🎬' : '🎙️'}
                  </div>
                )}

                {/* Progress Bar */}
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>

                {/* Content Type Badge */}
                <div className={styles.typeBadge}>
                  {item.contentType === 'video' ? '📹 Video' : '🎙️ Podcast'}
                </div>

                {/* Completed Badge */}
                {item.completed && (
                  <div className={styles.completedBadge}>✓ Completed</div>
                )}
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.title}>{item.contentTitle}</h3>

                <div className={styles.meta}>
                  <span className={styles.progress}>
                    {item.progressPercent}% complete
                  </span>
                  {item.duration && (
                    <span className={styles.duration}>
                      {formatDuration(item.position)} / {formatDuration(item.duration)}
                    </span>
                  )}
                </div>

                <div className={styles.lastWatched}>
                  Last watched {formatDate(item.lastWatchedAt)}
                </div>

                <div className={styles.actions}>
                  <Link href={item.contentUrl} className={styles.continueButton}>
                    {item.completed ? 'Watch Again' : 'Continue'}
                  </Link>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(item.contentType, item.contentId)}
                    title="Remove from history"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
