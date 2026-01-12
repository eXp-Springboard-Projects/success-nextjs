import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, FileText, Calendar, Target, Star, Image, TrendingUp, Search, CheckCircle, Lock, BarChart3, Download, Edit, User, Users, Mail, DollarSign, type LucideIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { StatCard, IllustrationCard, UpdateCard, ModernCard } from '../../components/admin/shared/ModernCard';
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
    { label: 'New Article', href: '/admin/posts/new', icon: Pencil, color: '#764ba2' },
    { label: 'Featured Content', href: '/admin/featured-content', icon: Star, color: '#f59e0b' },
    { label: 'Authors', href: '/admin/authors', icon: User, color: '#ec4899' },
    { label: 'Page Editor', href: '/admin/page-editor', icon: Edit, color: '#8b5cf6' },
    { label: 'Editorial Calendar', href: '/admin/editorial-calendar', icon: Calendar, color: '#06b6d4' },
    { label: 'SUCCESS+ Resources', href: '/admin/resources', icon: Download, color: '#e65c00' },
    { label: 'SEO Manager', href: '/admin/seo', icon: Target, color: '#10b981' },
    { label: 'Site Analytics', href: '/admin/analytics', icon: TrendingUp, color: '#4facfe' },
    { label: 'Site Monitor', href: '/admin/site-monitor', icon: Search, color: '#ff6b6b' },
  ];

  return (
    <AdminLayout>
      <div className={styles.dashboard}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.welcomeTitle}>Hello {session.user.name.split(' ')[0]}, Welcome back</h1>
            <p className={styles.subtitle}>Your Dashboard is updated</p>
          </div>
        </div>

        {/* Modern Dashboard Grid */}
        <div className={styles.modernGrid}>
          {/* Featured Illustration Card */}
          <div className={styles.gridFeatured}>
            <IllustrationCard
              title="What's your plan?"
              description="Easily start a new day"
              gradient="blue"
              size="wide"
            />
          </div>

          {/* Stat Cards */}
          <div className={styles.gridStat}>
            <StatCard
              icon={<FileText size={24} />}
              label="Total Posts"
              value="1,247"
              change="+12% from last month"
              changeType="positive"
              gradient="purple"
            />
          </div>

          <div className={styles.gridStat}>
            <StatCard
              icon={<Users size={24} />}
              label="Active Members"
              value="5,842"
              change="+8% from last month"
              changeType="positive"
              gradient="blue"
            />
          </div>

          <div className={styles.gridStat}>
            <StatCard
              icon={<Mail size={24} />}
              label="Email Campaigns"
              value="36"
              change="+4 this week"
              changeType="positive"
              gradient="orange"
            />
          </div>

          <div className={styles.gridStat}>
            <StatCard
              icon={<DollarSign size={24} />}
              label="Revenue"
              value="$52,847"
              change="+15% from last month"
              changeType="positive"
              gradient="pink"
            />
          </div>

          {/* Latest Updates Section */}
          <div className={styles.gridUpdates}>
            <ModernCard>
              <h3 className={styles.sectionTitle}>Latest updates</h3>
              <div className={styles.updatesList}>
                <UpdateCard
                  icon={<FileText size={20} />}
                  title="New Articles"
                  value="+187 new"
                  trend="up"
                  color="#8B5CF6"
                />
                <UpdateCard
                  icon={<Users size={20} />}
                  title="New Members"
                  value="+856 new"
                  trend="up"
                  color="#EC4899"
                />
                <UpdateCard
                  icon={<Mail size={20} />}
                  title="Email Opens"
                  value="+382 new"
                  trend="up"
                  color="#F97316"
                />
              </div>
            </ModernCard>
          </div>

          {/* Quick Actions Card */}
          <div className={styles.gridActions}>
            <ModernCard>
              <h3 className={styles.sectionTitle}>Quick Actions</h3>
              <div className={styles.actionButtons}>
                <Link href="/admin/posts/new" className={styles.actionButton}>
                  <Pencil size={16} />
                  <span>New Article</span>
                </Link>
                <Link href="/admin/content-viewer" className={styles.actionButton}>
                  <FileText size={16} />
                  <span>View Content</span>
                </Link>
                <Link href="/admin/crm/campaigns/new" className={styles.actionButton}>
                  <Mail size={16} />
                  <span>New Campaign</span>
                </Link>
                <Link href="/admin/members" className={styles.actionButton}>
                  <Users size={16} />
                  <span>Manage Members</span>
                </Link>
              </div>
            </ModernCard>
          </div>

          {/* Revenue Card with Gradient */}
          <div className={styles.gridRevenue}>
            <IllustrationCard
              title="Total profit, 32K Earned"
              description="Points Earned / 15,000"
              gradient="pink"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
