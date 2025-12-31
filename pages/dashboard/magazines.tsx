import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';
import magazineStyles from './magazines.module.css';

interface Magazine {
  id: string;
  title: string;
  slug: string;
  publishedText: string;
  description: string;
  pdfUrl?: string;
  flipbookUrl?: string;
  coverImageUrl: string;
  fileSize: number;
  currentPage: number;
  totalPages: number;
  completed: boolean;
  lastReadAt: string | null;
  status: string;
}

export default function MagazinesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/magazines');
    } else if (status === 'authenticated') {
      fetchMagazines();
    }
  }, [status]);

  const fetchMagazines = async () => {
    try {
      const response = await fetch('/api/dashboard/magazines');

      if (response.status === 403) {
        router.push('/subscribe?error=subscription_required');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch magazines');
      }

      const data = await response.json();
      setMagazines(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMagazine = (magazine: Magazine) => {
    setSelectedMagazine(magazine);
  };

  const handleCloseMagazine = () => {
    setSelectedMagazine(null);
  };

  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Get unique years from magazines
  const years = ['all', ...new Set(magazines.map(m => {
    const date = new Date(m.publishedText);
    return date.getFullYear().toString();
  }).filter(Boolean))].sort().reverse();

  const filteredMagazines = yearFilter === 'all'
    ? magazines
    : magazines.filter(m => {
        const date = new Date(m.publishedText);
        return date.getFullYear().toString() === yearFilter;
      });

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Digital Magazine Library - SUCCESS+</title>
        <meta name="description" content="Access your SUCCESS Magazine digital archive with interactive flipbook reader" />
      </Head>

      <div className={styles.dashboardLayout}>
        {!selectedMagazine && (
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
                <button><span className={styles.icon}>🎥</span> Videos</button>
              </Link>
              <Link href="/dashboard/podcasts">
                <button><span className={styles.icon}>🎙️</span> Podcasts</button>
              </Link>
              <Link href="/dashboard/magazines">
                <button className={styles.active}><span className={styles.icon}>📖</span> Magazines</button>
              </Link>
              <Link href="/dashboard/settings">
                <button><span className={styles.icon}>⚙️</span> Settings</button>
              </Link>
            </nav>
          </aside>
        )}

        <main className={!selectedMagazine ? styles.mainContent : magazineStyles.readerFullPage}>
          {!selectedMagazine ? (
            <>
              <div className={styles.header}>
                <h1>Digital Magazine Library</h1>
                <p className={styles.subtitle}>Enjoy SUCCESS Magazine in an immersive flipbook experience</p>
              </div>

              <div className={magazineStyles.filterBar}>
                <label>Filter by year:</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className={magazineStyles.yearFilter}
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year === 'all' ? 'All Years' : year}
                    </option>
                  ))}
                </select>
                <span className={magazineStyles.count}>
                  {filteredMagazines.length} {filteredMagazines.length === 1 ? 'issue' : 'issues'}
                </span>
              </div>

              <div className={magazineStyles.magazinesGrid}>
                {filteredMagazines.map((magazine) => (
                  <div key={magazine.id} className={magazineStyles.magazineCard}>
                    <div className={magazineStyles.magazineCover}>
                      <img
                        src={magazine.coverImageUrl || '/magazine-placeholder.jpg'}
                        alt={magazine.title}
                      />
                      {magazine.currentPage > 1 && (
                        <div className={magazineStyles.progressBadge}>
                          {Math.round((magazine.currentPage / magazine.totalPages) * 100)}%
                        </div>
                      )}
                      {magazine.completed && (
                        <div className={magazineStyles.completedBadge}>✓ Read</div>
                      )}
                    </div>
                    <div className={magazineStyles.magazineInfo}>
                      <h3>{magazine.title}</h3>
                      <p className={magazineStyles.publishDate}>{magazine.publishedText}</p>
                      {magazine.description && (
                        <p className={magazineStyles.description}>{magazine.description}</p>
                      )}

                      {magazine.lastReadAt && (
                        <p className={magazineStyles.lastRead}>
                          Last read: {new Date(magazine.lastReadAt).toLocaleDateString()}
                        </p>
                      )}

                      <div className={magazineStyles.buttonGroup}>
                        <button
                          className={magazineStyles.readBtn}
                          onClick={() => handleOpenMagazine(magazine)}
                        >
                          <span className={magazineStyles.icon}>📖</span>
                          {magazine.currentPage > 1 ? 'Continue Reading' : 'Read Now'}
                        </button>
                        {magazine.pdfUrl && (
                          <a
                            href={magazine.pdfUrl}
                            download
                            className={magazineStyles.downloadBtn}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className={magazineStyles.icon}>⬇️</span>
                            Download PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMagazines.length === 0 && !loading && (
                <div className={styles.emptyState}>
                  <p>No magazines available {yearFilter !== 'all' ? `for ${yearFilter}` : ''}.</p>
                </div>
              )}
            </>
          ) : (
            <div className={magazineStyles.flipbookReader}>
              <div className={magazineStyles.readerHeader}>
                <button className={magazineStyles.closeBtn} onClick={handleCloseMagazine}>
                  ← Back to Library
                </button>
                <h2 className={magazineStyles.readerTitle}>{selectedMagazine.title}</h2>
              </div>

              {selectedMagazine.flipbookUrl ? (
                <iframe
                  src={selectedMagazine.flipbookUrl}
                  className={magazineStyles.flipbookIframe}
                  title={selectedMagazine.title}
                  allowFullScreen
                />
              ) : (
                <div className={magazineStyles.noFlipbook}>
                  <p>Magazine viewer not available</p>
                  {selectedMagazine.pdfUrl && (
                    <a href={selectedMagazine.pdfUrl} download className={magazineStyles.downloadBtn}>
                      <span className={magazineStyles.icon}>⬇️</span>
                      Download PDF Instead
                    </a>
                  )}
                </div>
              )}
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
