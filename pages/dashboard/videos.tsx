import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function VideosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/videos');
    } else if (status === 'authenticated') {
      // Check subscription status
      checkSubscription();
    }
  }, [status]);

  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/dashboard/settings');
      if (response.status === 403 || response.status === 401) {
        router.push('/subscribe?error=subscription_required');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Videos - SUCCESS+ Dashboard</title>
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Link href="/dashboard">
              <img src="/success-logo.png" alt="SUCCESS" />
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
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resources</button>
            </Link>
            <Link href="/dashboard/labs">
              <button><span className={styles.icon}>🔬</span> Success Labs</button>
            </Link>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events</button>
            </Link>
            <Link href="/dashboard/videos">
              <button className={styles.active}><span className={styles.icon}>🎥</span> Videos</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcasts</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazines</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Video Library</h1>
            <p className={styles.subtitle}>Building our exclusive video collection for members</p>
          </div>

          <div className={styles.comingSoon}>
            <h2>Member-Exclusive Video Content</h2>
            <p>
              We're curating an extensive library of exclusive video content for SUCCESS+ members,
              including interviews with industry leaders, masterclasses, and behind-the-scenes content.
            </p>
            <p>
              While we build this collection, explore our{' '}
              <Link href="/dashboard/courses">premium courses</Link> which include comprehensive video lessons.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
