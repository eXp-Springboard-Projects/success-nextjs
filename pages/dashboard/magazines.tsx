import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';
import magazineStyles from './magazines.module.css';

export default function MagazinesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/magazines');
    }
  }, [status]);

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Magazine Archive - SUCCESS+</title>
        <meta name="description" content="Access your SUCCESS Magazine digital archive" />
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Link href="/dashboard">
              <div className={styles.logoText}>SUCCESS+</div>
            </Link>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button><span className={styles.icon}>📊</span> Dashboard</button>
            </Link>
            <Link href="/dashboard/premium">
              <button><span className={styles.icon}>⭐</span> Premium Content</button>
            </Link>
            <Link href="/dashboard/courses">
              <button><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/disc-profile">
              <button><span className={styles.icon}>🎯</span> My DISC Profile</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resource Library</button>
            </Link>
            <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer">
              <button><span className={styles.icon}>👥</span> Community</button>
            </a>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events Calendar</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button className={styles.active}><span className={styles.icon}>📖</span> Magazine</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcast</button>
            </Link>
            <Link href="/dashboard/shop">
              <button><span className={styles.icon}>🛍️</span> Shop</button>
            </Link>
            <Link href="/dashboard/help">
              <button><span className={styles.icon}>❓</span> Help Center</button>
            </Link>
            <Link href="/dashboard/billing">
              <button><span className={styles.icon}>💳</span> Billing & Orders</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Magazine Archive</h1>
            <p className={styles.subtitle}>Browse and read all SUCCESS Magazine issues</p>
          </div>

          <div className={magazineStyles.labsEmbed}>
            <iframe
              src="https://labs.success.com/past-magazines"
              className={magazineStyles.labsIframe}
              title="SUCCESS Magazine Archive"
              allowFullScreen
            />
          </div>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
