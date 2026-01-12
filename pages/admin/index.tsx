import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, FileText, Calendar, Target, Star, Image, TrendingUp, Search, CheckCircle, Lock, BarChart3, Download, Edit, User, type LucideIcon } from 'lucide-react';
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
        const res = await fetch('/api/posts?per_page=5&_embed=1');
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

  const quickActions: Array<{ label: string; description: string; href: string; icon: LucideIcon; color: string }> = [
    { label: 'New Article', description: 'Create and publish content', href: '/admin/posts/new', icon: Pencil, color: '#8B5CF6' },
    { label: 'View Content', description: 'Browse all published articles', href: '/admin/content-viewer', icon: FileText, color: '#3B82F6' },
    { label: 'Editorial Calendar', description: 'Schedule and plan content', href: '/admin/editorial-calendar', icon: Calendar, color: '#10B981' },
    { label: 'Featured Content', description: 'Manage homepage features', href: '/admin/featured-content', icon: Star, color: '#F59E0B' },
    { label: 'Authors', description: 'Manage author profiles', href: '/admin/authors', icon: User, color: '#EC4899' },
    { label: 'Page Editor', description: 'Edit static pages', href: '/admin/page-editor', icon: Edit, color: '#8B5CF6' },
    { label: 'Site Analytics', description: 'View traffic and engagement', href: '/admin/analytics', icon: TrendingUp, color: '#3B82F6' },
    { label: 'SEO Manager', description: 'Optimize for search engines', href: '/admin/seo', icon: Target, color: '#10B981' },
  ];

  return (
    <AdminLayout>
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Content Dashboard</h1>
            <p className={styles.subtitle}>Manage articles, media, and site content</p>
          </div>
          <Link href="/admin/posts/new" className={styles.primaryButton}>
            <Pencil size={16} />
            New Article
          </Link>
        </div>

        <DashboardStats />

        <div className={styles.mainContent}>
          <div className={styles.leftColumn}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
            </div>
            <div className={styles.actionsList}>
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={styles.actionItem}
                  >
                    <div className={styles.actionIconWrapper} style={{ backgroundColor: `${action.color}10` }}>
                      <IconComponent className={styles.actionIcon} size={20} style={{ color: action.color }} />
                    </div>
                    <div className={styles.actionContent}>
                      <p className={styles.actionLabel}>{action.label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className={styles.sectionHeader} style={{ marginTop: '2.5rem' }}>
              <h2 className={styles.sectionTitle}>Recent Articles</h2>
              <Link href="/admin/content-viewer" className={styles.viewAllLink}>View all</Link>
            </div>
            {recentPosts.length > 0 ? (
              <div className={styles.recentList}>
                {recentPosts.map((post: any) => {
                  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
                  return (
                    <Link key={post.id} href={`/admin/posts/${post.id}/edit`} className={styles.recentItem}>
                      {featuredImage && (
                        <img src={featuredImage} alt="" className={styles.recentThumbnail} />
                      )}
                      <div className={styles.recentContent}>
                        <p className={styles.recentTitle}>
                          {post.title?.rendered || 'Untitled'}
                        </p>
                        <p className={styles.recentMeta}>
                          {new Date(post.date).toLocaleDateString()} • {post.status}
                        </p>
                      </div>
                      <svg className={styles.actionChevron} width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FileText size={20} />
                </div>
                <p className={styles.emptyText}>No articles yet. Create your first article to get started.</p>
                <Link href="/admin/posts/new" className={styles.emptyButton}>
                  <Pencil size={14} />
                  Create Article
                </Link>
              </div>
            )}
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>System Status</h2>
            </div>
            <div className={styles.statusList}>
              <div className={styles.statusItem}>
                <div className={styles.statusDot} style={{ backgroundColor: '#10B981' }}></div>
                <span className={styles.statusLabel}>WordPress API</span>
                <span className={styles.statusValue}>Connected</span>
              </div>
              <div className={styles.statusDivider}></div>
              <div className={styles.statusItem}>
                <div className={styles.statusDot} style={{ backgroundColor: '#3B82F6' }}></div>
                <span className={styles.statusLabel}>Database</span>
                <span className={styles.statusValue}>Active</span>
              </div>
              <div className={styles.statusDivider}></div>
              <div className={styles.statusItem}>
                <div className={styles.statusDot} style={{ backgroundColor: '#8B5CF6' }}></div>
                <span className={styles.statusLabel}>SEO Status</span>
                <span className={styles.statusValue}>Optimized</span>
              </div>
              <div className={styles.statusDivider}></div>
              <div className={styles.statusItem}>
                <div className={styles.statusDot} style={{ backgroundColor: '#10B981' }}></div>
                <span className={styles.statusLabel}>Performance</span>
                <span className={styles.statusValue}>Good</span>
              </div>
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
