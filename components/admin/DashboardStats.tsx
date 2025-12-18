import { useEffect, useState } from 'react';
import { BookOpen, Star, Mail, Bookmark, RefreshCw } from 'lucide-react';
import styles from './DashboardStats.module.css';

interface DashboardData {
  overview: {
    totalPosts: number;
    totalVideos: number;
    totalPodcasts: number;
    totalCategories: number;
    totalUsers: number;
    activeSubscribers: number;
    newsletterSubscribers: number;
    magazineIssues: number;
  };
  content: {
    postsThisPeriod: number;
    videosThisPeriod: number;
    podcastsThisPeriod: number;
  };
  editorial: {
    totalItems: number;
    byStatus: {
      [key: string]: number;
    };
  };
  engagement: {
    totalBookmarks: number;
    avgBookmarksPerUser: number | string;
  };
}

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7'); // days

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const res = await fetch(`/api/analytics/dashboard?period=${period}&_=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      }
    } catch {
      // Silent fail - dashboard will show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className={styles.statsGrid}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.loadingShimmer}></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      label: 'Total Content',
      value: data.overview.totalPosts + data.overview.totalVideos + data.overview.totalPodcasts,
      change: `+${data.content.postsThisPeriod + data.content.videosThisPeriod + data.content.podcastsThisPeriod} this period`,
      icon: BookOpen,
      color: '#667eea',
    },
    {
      label: 'Active Subscribers',
      value: data.overview.activeSubscribers,
      change: 'SUCCESS+ Members',
      icon: Star,
      color: '#d32f2f',
    },
    {
      label: 'Newsletter Subscribers',
      value: data.overview.newsletterSubscribers,
      change: 'Total subscribers',
      icon: Mail,
      color: '#43e97b',
    },
    {
      label: 'Content Bookmarks',
      value: data.engagement.totalBookmarks,
      change: `${data.engagement.avgBookmarksPerUser} avg per user`,
      icon: Bookmark,
      color: '#f093fb',
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.periodSelector}>
        <div className={styles.periodButtons}>
          <button
            onClick={() => setPeriod('7')}
            className={period === '7' ? styles.periodActive : styles.periodButton}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('30')}
            className={period === '30' ? styles.periodActive : styles.periodButton}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setPeriod('90')}
            className={period === '90' ? styles.periodActive : styles.periodButton}
          >
            Last 90 Days
          </button>
        </div>
        <button
          onClick={handleRefresh}
          className={styles.refreshButton}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.label} className={styles.statCard} style={{ borderTopColor: stat.color }}>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                <IconComponent size={24} />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statLabel}>{stat.label}</h3>
                <p className={styles.statValue}>{stat.value.toLocaleString()}</p>
                <p className={styles.statChange}>{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailCard}>
          <h3>Content Breakdown</h3>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <span>Articles</span>
              <strong>{data.overview.totalPosts}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Videos</span>
              <strong>{data.overview.totalVideos}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Podcasts</span>
              <strong>{data.overview.totalPodcasts}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Magazine Issues</span>
              <strong>{data.overview.magazineIssues}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Categories</span>
              <strong>{data.overview.totalCategories}</strong>
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <h3>Recent Activity</h3>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <span>Posts (Last {period} days)</span>
              <strong className={styles.positive}>+{data.content.postsThisPeriod}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Videos (Last {period} days)</span>
              <strong className={styles.positive}>+{data.content.videosThisPeriod}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Podcasts (Last {period} days)</span>
              <strong className={styles.positive}>+{data.content.podcastsThisPeriod}</strong>
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <h3>Editorial Calendar</h3>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <span>Total Items</span>
              <strong>{data.editorial.totalItems}</strong>
            </div>
            {Object.entries(data.editorial.byStatus).map(([status, count]) => (
              <div key={status} className={styles.detailItem}>
                <span>{status.replace('_', ' ')}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.detailCard}>
          <h3>User Engagement</h3>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <span>Total Users</span>
              <strong>{data.overview.totalUsers}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Active Members</span>
              <strong className={styles.positive}>{data.overview.activeSubscribers}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Newsletter Subs</span>
              <strong>{data.overview.newsletterSubscribers}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Avg Bookmarks/User</span>
              <strong>{data.engagement.avgBookmarksPerUser}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
