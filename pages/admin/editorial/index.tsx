import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './Editorial.module.css';

interface DashboardStats {
  publishedThisWeek: number;
  drafts: number;
  scheduled: number;
  pendingReview: number;
  totalArticles: number;
  totalAuthors: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
  upcomingPublications: Array<{
    id: string;
    title: string;
    author: string;
    scheduledDate: string;
    category: string;
  }>;
}

export default function EditorialDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    publishedThisWeek: 0,
    drafts: 0,
    scheduled: 0,
    pendingReview: 0,
    totalArticles: 0,
    totalAuthors: 0,
    recentActivity: [],
    upcomingPublications: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/editorial/dashboard-stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  }, []);

  return (
    <DepartmentLayout
      currentDepartment={Department.EDITORIAL}
      pageTitle="Editorial Dashboard"
      description="Content management and publishing workflow"
    >
      <div className={styles.dashboard}>
        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Published This Week</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.publishedThisWeek}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>✍️</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Drafts</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.drafts}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Scheduled</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.scheduled}
              </div>
            </div>
          </div>

          <div className={`${styles.statCard} ${stats.pendingReview > 0 ? styles.statCardHighlight : ''}`}>
            <div className={styles.statIcon}>👀</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Pending Review</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.pendingReview}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Total Articles</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.totalArticles.toLocaleString()}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Authors</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.totalAuthors}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link href="/admin/posts/new" className={styles.actionCard}>
              <div className={styles.actionIcon}>➕</div>
              <div className={styles.actionTitle}>New Article</div>
              <div className={styles.actionDescription}>
                Create a new article or blog post
              </div>
            </Link>

            <Link href="/admin/posts" className={styles.actionCard}>
              <div className={styles.actionIcon}>📝</div>
              <div className={styles.actionTitle}>Manage Articles</div>
              <div className={styles.actionDescription}>
                View, edit, and organize all articles
              </div>
            </Link>

            <Link href="/admin/media" className={styles.actionCard}>
              <div className={styles.actionIcon}>🖼️</div>
              <div className={styles.actionTitle}>Media Library</div>
              <div className={styles.actionDescription}>
                Upload and manage images and media
              </div>
            </Link>

            <Link href="/admin/categories" className={styles.actionCard}>
              <div className={styles.actionIcon}>🏷️</div>
              <div className={styles.actionTitle}>Categories & Tags</div>
              <div className={styles.actionDescription}>
                Organize content taxonomy
              </div>
            </Link>

            <Link href="/admin/users" className={styles.actionCard}>
              <div className={styles.actionIcon}>✍️</div>
              <div className={styles.actionTitle}>Authors</div>
              <div className={styles.actionDescription}>
                Manage author profiles and permissions
              </div>
            </Link>

            <Link href="/admin/editorial-calendar" className={styles.actionCard}>
              <div className={styles.actionIcon}>📅</div>
              <div className={styles.actionTitle}>Publishing Calendar</div>
              <div className={styles.actionDescription}>
                View scheduled content timeline
              </div>
            </Link>
          </div>
        </div>

        <div className={styles.twoColumn}>
          {/* Upcoming Publications */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Upcoming Publications (Next 7 Days)</h2>
            <div className={styles.publicationsList}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : stats.upcomingPublications.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <div>No scheduled publications</div>
                </div>
              ) : (
                stats.upcomingPublications.map((pub) => (
                  <div key={pub.id} className={styles.publicationItem}>
                    <div className={styles.publicationDate}>
                      <div className={styles.dateDay}>
                        {new Date(pub.scheduledDate).getDate()}
                      </div>
                      <div className={styles.dateMonth}>
                        {new Date(pub.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <div className={styles.publicationContent}>
                      <div className={styles.publicationTitle}>{pub.title}</div>
                      <div className={styles.publicationMeta}>
                        <span className={styles.publicationAuthor}>{pub.author}</span>
                        <span className={styles.publicationCategory}>{pub.category}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <div className={styles.activityList}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : stats.recentActivity.length === 0 ? (
                <div className={styles.emptyState}>No recent activity</div>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {activity.type === 'post' ? '📝' :
                       activity.type === 'publish' ? '🚀' :
                       activity.type === 'author' ? '👤' :
                       activity.type === 'media' ? '🖼️' : '📄'}
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>{activity.description}</div>
                      <div className={styles.activityMeta}>
                        {activity.user && `${activity.user} • `}
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Content Performance */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Stats</h2>
          <div className={styles.miniStatsGrid}>
            <div className={styles.miniStat}>
              <div className={styles.miniStatValue}>{loading ? '...' : stats.totalArticles}</div>
              <div className={styles.miniStatLabel}>Total Articles</div>
            </div>
            <div className={styles.miniStat}>
              <div className={styles.miniStatValue}>{loading ? '...' : stats.publishedThisWeek}</div>
              <div className={styles.miniStatLabel}>Published This Week</div>
            </div>
            <div className={styles.miniStat}>
              <div className={styles.miniStatValue}>{loading ? '...' : stats.scheduled}</div>
              <div className={styles.miniStatLabel}>Scheduled Articles</div>
            </div>
            <div className={styles.miniStat}>
              <div className={styles.miniStatValue}>{loading ? '...' : stats.totalAuthors}</div>
              <div className={styles.miniStatLabel}>Active Authors</div>
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.EDITORIAL);
