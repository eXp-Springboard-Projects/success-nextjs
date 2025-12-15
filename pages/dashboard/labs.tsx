import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface Lab {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  toolUrl: string;
}

export default function SuccessLabsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/labs');
    } else if (status === 'authenticated') {
      fetchLabs();
    }
  }, [status, categoryFilter]);

  const fetchLabs = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/dashboard/labs?${params}`);

      if (response.status === 403) {
        router.push('/subscribe?error=subscription_required');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch labs');
      }

      const data = await response.json();
      setLabs(data);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchLab = (toolUrl: string) => {
    window.open(toolUrl, '_blank');
  };

  const categories = ['all', ...new Set(labs.map((l) => l.category).filter(Boolean))];

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Success Labs - SUCCESS+ Dashboard</title>
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
              <button className={styles.active}><span className={styles.icon}>🔬</span> Success Labs</button>
            </Link>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events</button>
            </Link>
            <Link href="/dashboard/videos">
              <button><span className={styles.icon}>🎥</span> Videos</button>
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
            <h1>Success Labs</h1>
            <p className={styles.subtitle}>Interactive tools and exercises to accelerate your growth</p>
          </div>

          <div className={styles.filters}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.categorySelect}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.labsGrid}>
            {labs.map((lab) => (
              <div key={lab.id} className={styles.labCard}>
                <div className={styles.labImage}>
                  <img src={lab.thumbnail || '/placeholder-lab.jpg'} alt={lab.title} />
                  {lab.category && (
                    <div className={styles.categoryBadge}>{lab.category}</div>
                  )}
                </div>
                <div className={styles.labContent}>
                  <h3>{lab.title}</h3>
                  <p>{lab.description}</p>

                  <button
                    className={styles.launchBtn}
                    onClick={() => handleLaunchLab(lab.toolUrl)}
                  >
                    Launch Tool
                  </button>
                </div>
              </div>
            ))}
          </div>

          {labs.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <p>No labs found matching your filters.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
