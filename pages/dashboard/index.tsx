import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import TrialStatusBanner from '../../components/dashboard/TrialStatusBanner';
import styles from './dashboard.module.css';
import premiumStyles from './dashboard-premium.module.css';

export default function MemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!session) {
    router.push('/signin?redirect=/dashboard');
    return null;
  }

  // Check user role and membership
  const isAdmin = session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN';
  const hasPremiumAccess = session.user?.membershipTier === 'PREMIUM' ||
                           session.user?.membershipTier === 'SUCCESS_PLUS' ||
                           isAdmin;

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>My Dashboard - SUCCESS+</title>
      </Head>

      <div className={styles.dashboardLayout}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <div className={styles.logoText}>SUCCESS+</div>
          </div>

          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button className={router.pathname === '/dashboard' ? styles.active : ''}>
                <span className={styles.icon}>📊</span>
                Dashboard
              </button>
            </Link>

            <Link href="/dashboard/premium">
              <button className={router.pathname === '/dashboard/premium' ? styles.active : ''}>
                <span className={styles.icon}>⭐</span>
                Premium Content
              </button>
            </Link>

            <Link href="/dashboard/courses">
              <button className={router.pathname === '/dashboard/courses' ? styles.active : ''}>
                <span className={styles.icon}>🎓</span>
                Courses
              </button>
            </Link>

            <Link href="/dashboard/disc-profile">
              <button className={router.pathname === '/dashboard/disc-profile' ? styles.active : ''}>
                <span className={styles.icon}>🎯</span>
                My DISC Profile
              </button>
            </Link>

            <Link href="/dashboard/resources">
              <button className={router.pathname === '/dashboard/resources' ? styles.active : ''}>
                <span className={styles.icon}>📚</span>
                Resource Library
              </button>
            </Link>

            <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer">
              <button>
                <span className={styles.icon}>👥</span>
                Community
              </button>
            </a>

            <Link href="/dashboard/events">
              <button className={router.pathname === '/dashboard/events' ? styles.active : ''}>
                <span className={styles.icon}>📅</span>
                Events Calendar
              </button>
            </Link>

            <Link href="/dashboard/magazines">
              <button className={router.pathname === '/dashboard/magazines' ? styles.active : ''}>
                <span className={styles.icon}>📖</span>
                Magazine
              </button>
            </Link>

            <Link href="/dashboard/podcasts">
              <button className={router.pathname === '/dashboard/podcasts' ? styles.active : ''}>
                <span className={styles.icon}>🎙️</span>
                Podcast
              </button>
            </Link>

            <Link href="/dashboard/shop">
              <button className={router.pathname === '/dashboard/shop' ? styles.active : ''}>
                <span className={styles.icon}>🛍️</span>
                Shop
              </button>
            </Link>

            <Link href="/dashboard/help">
              <button className={router.pathname === '/dashboard/help' ? styles.active : ''}>
                <span className={styles.icon}>❓</span>
                Help Center
              </button>
            </Link>

            <Link href="/dashboard/billing">
              <button className={router.pathname === '/dashboard/billing' ? styles.active : ''}>
                <span className={styles.icon}>💳</span>
                Billing & Orders
              </button>
            </Link>

            <Link href="/dashboard/settings">
              <button className={router.pathname === '/dashboard/settings' ? styles.active : ''}>
                <span className={styles.icon}>⚙️</span>
                Settings
              </button>
            </Link>

            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              <span className={styles.icon}>🚪</span>
              Log Out
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Welcome back{session.user?.name ? `, ${session.user.name.replace(/admin/gi, '').trim()}` : ''}!</h1>
            <p className={styles.subtitle}>
              {hasPremiumAccess
                ? 'Continue your journey to success with exclusive SUCCESS+ content'
                : 'Upgrade to SUCCESS+ to unlock exclusive courses, resources, and events'}
            </p>
            {isAdmin && (
              <div className={styles.adminBadge}>
                <span className={styles.badgeIcon}>👤</span>
                {session.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} Access
              </div>
            )}
          </div>

          {/* Trial Status Banner */}
          <TrialStatusBanner />

          {/* Premium Content Highlights for members */}
          {hasPremiumAccess && (
            <section className={styles.section}>
              <div className={premiumStyles.sectionHeader}>
                <h2>Premium Content</h2>
                <Link href="/dashboard/premium" className={premiumStyles.viewAllLink}>
                  View All →
                </Link>
              </div>
              <div className={premiumStyles.premiumHighlight}>
                <div className={premiumStyles.highlightCard}>
                  <span className={premiumStyles.highlightIcon}>⭐</span>
                  <h3>Exclusive Articles</h3>
                  <p>Access member-only insights and expert interviews</p>
                  <Link href="/dashboard/premium" className={premiumStyles.highlightBtn}>
                    Browse Premium Content
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* SUCCESS Labs - Featured */}
          <section className={styles.section}>
            <div className={premiumStyles.sectionHeader}>
              <h2>SUCCESS Labs</h2>
              <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" className={premiumStyles.viewAllLink}>
                Visit Labs →
              </a>
            </div>
            <div className={premiumStyles.premiumHighlight}>
              <div className={premiumStyles.highlightCard}>
                <span className={premiumStyles.highlightIcon}>🔬</span>
                <h3>Interactive Tools & Exercises</h3>
                <p>Access SUCCESS Labs for interactive business tools, AI-powered resources, and hands-on exercises to accelerate your growth.</p>
                <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" className={premiumStyles.highlightBtn}>
                  Explore SUCCESS Labs
                </a>
              </div>
            </div>
          </section>

          {/* Latest Magazine */}
          <section className={styles.section}>
            <div className={premiumStyles.sectionHeader}>
              <h2>Latest Magazine Issue</h2>
              <Link href="/dashboard/magazines" className={premiumStyles.viewAllLink}>
                View All Issues →
              </Link>
            </div>
            <div className={styles.magazineCard}>
              <div className={styles.magazineCover}>
                <img
                  src="https://successcom.wpenginepowered.com/wp-content/uploads/2026/01/SD26_JAN-Digi-_-COVER-_-Amy-Porterfield_WEB-1-scaled.jpg"
                  alt="SUCCESS Magazine January 2026 - The Guide to Reinvention"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="300" height="400" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="18" font-weight="bold"%3ESUCCESS%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className={styles.magazineInfo}>
                <h3>January 2026</h3>
                <p className={styles.featured}>Featuring: Amy Porterfield</p>
                <p>Discover the multimillion-dollar pivot in our Guide to Reinvention. Learn how Amy Porterfield transformed her career and built an empire.</p>
                <Link href="/dashboard/magazines">
                  <button className={styles.readBtn}>Read Now</button>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

// Force SSR to prevent NextRouter errors during build
export async function getServerSideProps() {
  return {
    props: {},
  };
}
