import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, FileText, Calendar, Target, Star, Image, TrendingUp, Search, CheckCircle, Lock, BarChart3, Download, type LucideIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import DashboardStats from '../../components/admin/DashboardStats';
import styles from './Dashboard.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Auth is handled by requireAdminAuth in getServerSideProps
    // No client-side redirects needed
  }, [status, session, router]);

  useEffect(() => {
    // Fetch recent posts
    async function fetchRecentData() {
      try {
        const res = await fetch('/api/posts?per_page=5');
        if (res.ok) {
          const data = await res.json();
          setRecentPosts(data);
        }
      } catch {
        // Silent fail - recent posts section will show empty state
      }
    }

    if (session) {
      fetchRecentData();
    }
  }, [session]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const quickActions: Array<{ label: string; href: string; icon: LucideIcon; color: string }> = [
    { label: 'View Content', href: '/admin/content-viewer', icon: FileText, color: '#667eea' },
    { label: 'New Post', href: '/admin/posts/new', icon: Pencil, color: '#764ba2' },
    { label: 'Editorial Calendar', href: '/admin/editorial-calendar', icon: Calendar, color: '#8b5cf6' },
    { label: 'Resource Library', href: '/admin/resources', icon: Download, color: '#e65c00' },
    { label: 'SUCCESS+', href: '/success-plus/account', icon: Star, color: '#c41e3a' },
    { label: 'SEO Manager', href: '/admin/seo', icon: Target, color: '#10b981' },
    { label: 'Site Analytics', href: '/admin/analytics', icon: TrendingUp, color: '#4facfe' },
    { label: 'Site Monitor', href: '/admin/site-monitor', icon: Search, color: '#ff6b6b' },
  ];

  return (
    <AdminLayout>
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <h1>Welcome back, {session.user.name}!</h1>
            <p className={styles.subtitle}>Here's what's happening with your site today</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/admin/posts/new" className={styles.primaryButton}>
              <Pencil size={16} /> New Post
            </Link>
          </div>
        </div>

        <DashboardStats />

        <div className={styles.quickActionsSection}>
          <h2>Quick Actions</h2>
          <div className={styles.quickActions}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={styles.quickAction}
                  style={{ borderLeftColor: action.color }}
                >
                  <span className={styles.quickActionIcon} style={{ color: action.color }}>
                    <IconComponent size={20} />
                  </span>
                  <span className={styles.quickActionLabel}>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h2>Recent Posts</h2>
              <Link href="/admin/content-viewer" className={styles.viewAllLink}>View All</Link>
            </div>
            {recentPosts.length > 0 ? (
              <div className={styles.recentList}>
                {recentPosts.map((post: any) => (
                  <div key={post.id} className={styles.recentItem}>
                    <div className={styles.recentItemContent}>
                      <h3 className={styles.recentItemTitle}>
                        {post.title?.rendered || 'Untitled'}
                      </h3>
                      <p className={styles.recentItemMeta}>
                        {new Date(post.date).toLocaleDateString()} • {post.status}
                      </p>
                    </div>
                    <Link href={`/admin/posts/${post.id}/edit`} className={styles.editButton}>
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>No posts yet. Create your first post!</p>
            )}
          </div>

          <div className={styles.activitySection}>
            <h2>Site Health</h2>
            <div className={styles.healthCards}>
              <div className={styles.healthCard}>
                <div className={styles.healthIcon} style={{ color: '#10b981' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3>Performance</h3>
                  <p>Good</p>
                </div>
              </div>
              <div className={styles.healthCard}>
                <div className={styles.healthIcon} style={{ color: '#3b82f6' }}>
                  <Lock size={24} />
                </div>
                <div>
                  <h3>Security</h3>
                  <p>Protected</p>
                </div>
              </div>
              <div className={styles.healthCard}>
                <div className={styles.healthIcon} style={{ color: '#8b5cf6' }}>
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3>SEO</h3>
                  <p>Optimized</p>
                </div>
              </div>
            </div>

            <div className={styles.atAGlance}>
              <h3>At a Glance</h3>
              <ul className={styles.glanceList}>
                <li><CheckCircle size={14} style={{ marginRight: '6px', color: '#10b981' }} /> WordPress API Connected</li>
                <li><CheckCircle size={14} style={{ marginRight: '6px', color: '#10b981' }} /> Database Connected</li>
                <li><CheckCircle size={14} style={{ marginRight: '6px', color: '#10b981' }} /> Admin Access Active</li>
                <li><CheckCircle size={14} style={{ marginRight: '6px', color: '#10b981' }} /> All Systems Operational</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
