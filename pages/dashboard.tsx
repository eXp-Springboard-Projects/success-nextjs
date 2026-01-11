import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './Dashboard.module.css';

interface DashboardStats {
  coursesCompleted: number;
  resourcesDownloaded: number;
  upcomingEvents: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    coursesCompleted: 0,
    resourcesDownloaded: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/dashboard');
    } else if (session?.user) {
      fetchDashboardData();
    }
  }, [status, session, router]);

  async function fetchDashboardData() {
    try {
      // TODO: Fetch real stats from API
      setTimeout(() => {
        setStats({
          coursesCompleted: 3,
          resourcesDownloaded: 12,
          upcomingEvents: 2,
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isSuccessPlus = session.user?.membershipTier === 'SUCCESS_PLUS' ||
                        session.user?.membershipTier === 'success_plus' ||
                        session.user?.email?.endsWith('@success.com');

  return (
    <>
      <Head>
        <title>My Dashboard | SUCCESS+</title>
        <meta name="description" content="Your personal SUCCESS+ dashboard" />
      </Head>

      <div className={styles.dashboard}>
        <div className={styles.container}>
          {/* Header */}
          <header className={styles.header}>
            <div>
              <h1>Welcome back, {session.user?.name?.split(' ')[0] || 'Member'}!</h1>
              <p className={styles.subtitle}>Continue your journey to success</p>
            </div>
            <Link href="/success-plus/account" className={styles.accountButton}>
              My Account
            </Link>
          </header>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📚</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.coursesCompleted}</div>
                <div className={styles.statLabel}>Courses Completed</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📥</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.resourcesDownloaded}</div>
                <div className={styles.statLabel}>Resources Downloaded</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.upcomingEvents}</div>
                <div className={styles.statLabel}>Upcoming Events</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section className={styles.section}>
            <h2>Quick Actions</h2>
            <div className={styles.actionsGrid}>
              <Link href="/courses" className={styles.actionCard}>
                <div className={styles.actionIcon}>🎓</div>
                <h3>Browse Courses</h3>
                <p>Explore our library of personal development courses</p>
              </Link>

              <Link href="/resources" className={styles.actionCard}>
                <div className={styles.actionIcon}>📚</div>
                <h3>Resource Library</h3>
                <p>Download guides, templates, and tools</p>
              </Link>

              <Link href="/events" className={styles.actionCard}>
                <div className={styles.actionIcon}>📅</div>
                <h3>Events</h3>
                <p>Join webinars, workshops, and community events</p>
              </Link>

              <Link href="/magazine" className={styles.actionCard}>
                <div className={styles.actionIcon}>📖</div>
                <h3>Digital Magazine</h3>
                <p>Read the latest SUCCESS Magazine issues</p>
              </Link>

              <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" className={styles.actionCard}>
                <div className={styles.actionIcon}>🧪</div>
                <h3>SUCCESS Labs</h3>
                <p>AI-powered coaching and exclusive community</p>
              </a>

              <Link href="/store" className={styles.actionCard}>
                <div className={styles.actionIcon}>🛍️</div>
                <h3>Shop</h3>
                <p>Browse books, courses, and merchandise</p>
              </Link>
            </div>
          </section>

          {/* Recommended Content */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Recommended For You</h2>
              <Link href="/magazine" className={styles.sectionLink}>View All →</Link>
            </div>
            <div className={styles.contentGrid}>
              <div className={styles.contentCard}>
                <div className={styles.contentBadge}>New</div>
                <h3>Leadership in the AI Age</h3>
                <p>How to lead teams through technological transformation</p>
                <Link href="/magazine">Read Article →</Link>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.contentBadge}>Popular</div>
                <h3>Morning Routine Mastery</h3>
                <p>Create a powerful morning routine that sets you up for success</p>
                <Link href="/magazine">Read Article →</Link>
              </div>

              <div className={styles.contentCard}>
                <div className={styles.contentBadge}>Trending</div>
                <h3>Building Unshakeable Confidence</h3>
                <p>Practical strategies to overcome self-doubt and imposter syndrome</p>
                <Link href="/magazine">Read Article →</Link>
              </div>
            </div>
          </section>

          {/* Upgrade CTA (for non-SUCCESS+ members) */}
          {!isSuccessPlus && (
            <section className={styles.upgradeSection}>
              <div className={styles.upgradeCard}>
                <h2>Unlock Your Full Potential</h2>
                <p>
                  Upgrade to SUCCESS+ for unlimited access to courses, exclusive content,
                  and member-only benefits.
                </p>
                <div className={styles.upgradeBenefits}>
                  <div className={styles.benefit}>✓ 100+ on-demand courses</div>
                  <div className={styles.benefit}>✓ Premium articles & resources</div>
                  <div className={styles.benefit}>✓ Member-only events & webinars</div>
                  <div className={styles.benefit}>✓ Digital magazine access</div>
                </div>
                <Link href="/success-plus" className={styles.upgradeButton}>
                  Upgrade to SUCCESS+
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
