import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import TrialStatusBanner from '../../components/dashboard/TrialStatusBanner';
import SubscriptionStatusWidget from '../../components/dashboard/SubscriptionStatusWidget';
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
            <img src="/success-logo.png" alt="SUCCESS" />
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

            <Link href="/dashboard/community">
              <button className={router.pathname === '/dashboard/community' ? styles.active : ''}>
                <span className={styles.icon}>👥</span>
                Community
              </button>
            </Link>

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

          {/* Subscription Status Widget */}
          <SubscriptionStatusWidget />

          {/* Quick Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🎓</div>
              <div className={styles.statInfo}>
                <h3>Courses in Progress</h3>
                <p className={styles.statNumber}>3</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statInfo}>
                <h3>Completed Courses</h3>
                <p className={styles.statNumber}>12</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏱️</div>
              <div className={styles.statInfo}>
                <h3>Learning Hours</h3>
                <p className={styles.statNumber}>47</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏆</div>
              <div className={styles.statInfo}>
                <h3>Certificates Earned</h3>
                <p className={styles.statNumber}>8</p>
              </div>
            </div>
          </div>

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

          {/* Continue Learning */}
          <section className={styles.section}>
            <h2>Continue Learning</h2>
            <div className={styles.coursesGrid}>
              <div className={styles.courseCard}>
                <div className={styles.courseImage}>
                  <img
                    src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop"
                    alt="Jim Rohn's Foundations for Success"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ECourse Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className={styles.progressBadge}>45% Complete</div>
                </div>
                <div className={styles.courseInfo}>
                  <h3>Jim Rohn's Foundations for Success</h3>
                  <p>Module 5 of 10</p>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '45%' }}></div>
                  </div>
                  <button className={styles.continueBtn}>Continue Course</button>
                </div>
              </div>

              <div className={styles.courseCard}>
                <div className={styles.courseImage}>
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop"
                    alt="Leadership Masterclass"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ECourse Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className={styles.progressBadge}>20% Complete</div>
                </div>
                <div className={styles.courseInfo}>
                  <h3>Leadership Masterclass</h3>
                  <p>Lesson 3 of 15</p>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '20%' }}></div>
                  </div>
                  <button className={styles.continueBtn}>Continue Course</button>
                </div>
              </div>

              <div className={styles.courseCard}>
                <div className={styles.courseImage}>
                  <img
                    src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop"
                    alt="Time Management Mastery"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ECourse Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className={styles.progressBadge}>80% Complete</div>
                </div>
                <div className={styles.courseInfo}>
                  <h3>Time Management Mastery</h3>
                  <p>Almost done!</p>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '80%' }}></div>
                  </div>
                  <button className={styles.continueBtn}>Finish Course</button>
                </div>
              </div>
            </div>
          </section>

          {/* Upcoming Events */}
          <section className={styles.section}>
            <h2>Upcoming Events</h2>
            <div className={styles.eventsList}>
              <div className={styles.eventCard}>
                <div className={styles.eventDate}>
                  <div className={styles.month}>JAN</div>
                  <div className={styles.day}>15</div>
                </div>
                <div className={styles.eventInfo}>
                  <h3>Live Q&A with SUCCESS Experts</h3>
                  <p>2:00 PM EST • Online</p>
                </div>
                <button className={styles.eventBtn}>Register</button>
              </div>

              <div className={styles.eventCard}>
                <div className={styles.eventDate}>
                  <div className={styles.month}>JAN</div>
                  <div className={styles.day}>22</div>
                </div>
                <div className={styles.eventInfo}>
                  <h3>Goal Setting Workshop</h3>
                  <p>6:00 PM EST • Virtual</p>
                </div>
                <button className={styles.eventBtn}>Register</button>
              </div>
            </div>
          </section>

          {/* Latest Magazine */}
          <section className={styles.section}>
            <h2>Latest Magazine Issue</h2>
            <div className={styles.magazineCard}>
              <div className={styles.magazineCover}>
                <img
                  src="https://successcom.wpenginepowered.com/wp-content/uploads/2025/11/SD25_06_NOV_DIGITAL-ED-_-COVER-_-RORY-VADEN_2048x1082-1.jpg"
                  alt="SUCCESS Magazine November 2025 - Guide to Philanthropy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect width="300" height="400" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="18" font-weight="bold"%3ESUCCESS%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className={styles.magazineInfo}>
                <h3>November 2025</h3>
                <p className={styles.featured}>Featuring: Rory Vaden</p>
                <p>Discover how purpose and generosity define true success in the Guide to Philanthropy. Read it free on SUCCESS Labs.</p>
                <button className={styles.readBtn} onClick={() => window.open('https://labs.success.com/november2025', '_blank')}>Read Now</button>
              </div>
            </div>
          </section>

          {/* Recommended Courses */}
          <section className={styles.section}>
            <h2>Recommended for You</h2>
            <div className={styles.recommendedGrid}>
              <div className={styles.recommendCard}>
                <img
                  src="https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400&h=300&fit=crop"
                  alt="Personal Development Blueprint"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ECourse Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <h4>Personal Development Blueprint</h4>
                <p>8 modules • Beginner</p>
                <button className={styles.startBtn}>Start Course</button>
              </div>

              <div className={styles.recommendCard}>
                <img
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop"
                  alt="Communication Skills Bootcamp"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ECourse Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <h4>Communication Skills Bootcamp</h4>
                <p>12 lessons • Intermediate</p>
                <button className={styles.startBtn}>Start Course</button>
              </div>

              <div className={styles.recommendCard}>
                <img
                  src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop"
                  alt="Goal Setting for Success"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ECourse Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <h4>Goal Setting for Success</h4>
                <p>6 modules • All Levels</p>
                <button className={styles.startBtn}>Start Course</button>
              </div>

              <div className={styles.recommendCard}>
                <img
                  src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop"
                  alt="Financial Freedom Fundamentals"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3ECourse Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <h4>Financial Freedom Fundamentals</h4>
                <p>10 modules • Beginner</p>
                <button className={styles.startBtn}>Start Course</button>
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
