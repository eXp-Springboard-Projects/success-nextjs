import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function DashboardContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalResources: 0,
    totalLabs: 0,
    totalEvents: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Check if user is admin
      if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        router.push('/');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <>
      <Head>
        <title>SUCCESS+ Dashboard Content - Admin</title>
      </Head>

      <div className={styles.adminLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <h2>SUCCESS Admin</h2>
          </div>
          <nav className={styles.nav}>
            <Link href="/admin">
              <button>📊 Dashboard</button>
            </Link>
            <Link href="/admin/dashboard-content">
              <button className={styles.active}>🎓 SUCCESS+ Content</button>
            </Link>
            <Link href="/admin/posts">
              <button>📝 Posts</button>
            </Link>
            <Link href="/admin/members">
              <button>👥 Members</button>
            </Link>
            <Link href="/dashboard">
              <button>👁️ View Dashboard</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>SUCCESS+ Dashboard Content</h1>
            <p className={styles.subtitle}>Manage courses, resources, labs, and events</p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🎓</div>
              <div className={styles.statInfo}>
                <h3>Courses</h3>
                <p className={styles.statNumber}>{stats.totalCourses}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📚</div>
              <div className={styles.statInfo}>
                <h3>Resources</h3>
                <p className={styles.statNumber}>{stats.totalResources}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔬</div>
              <div className={styles.statInfo}>
                <h3>Success Labs</h3>
                <p className={styles.statNumber}>{stats.totalLabs}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statInfo}>
                <h3>Events</h3>
                <p className={styles.statNumber}>{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className={styles.quickActions}>
            <h2>Quick Actions</h2>
            <div className={styles.actionsGrid}>
              <Link href="/admin/dashboard-content/courses" className={styles.actionCard}>
                <div className={styles.actionIcon}>🎓</div>
                <h3>Manage Courses</h3>
                <p>Create and edit courses, modules, and lessons</p>
              </Link>

              <Link href="/admin/dashboard-content/resources" className={styles.actionCard}>
                <div className={styles.actionIcon}>📚</div>
                <h3>Manage Resources</h3>
                <p>Upload and organize downloadable resources</p>
              </Link>

              <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" className={styles.actionCard}>
                <div className={styles.actionIcon}>🔬</div>
                <h3>SUCCESS Labs</h3>
                <p>Access interactive tools and AI-powered resources →</p>
              </a>

              <Link href="/admin/dashboard-content/events" className={styles.actionCard}>
                <div className={styles.actionIcon}>📅</div>
                <h3>Manage Events</h3>
                <p>Schedule webinars, workshops, and events</p>
              </Link>

              <Link href="/dashboard" className={styles.actionCard}>
                <div className={styles.actionIcon}>👁️</div>
                <h3>Preview Dashboard</h3>
                <p>View the SUCCESS+ member dashboard</p>
              </Link>

              <Link href="/admin/analytics" className={styles.actionCard}>
                <div className={styles.actionIcon}>📊</div>
                <h3>View Analytics</h3>
                <p>Track engagement and usage metrics</p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
