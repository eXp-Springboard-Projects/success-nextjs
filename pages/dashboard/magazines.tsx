import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import HTMLFlipBook from 'react-pageflip';
import styles from './dashboard.module.css';
import magazineStyles from './magazines.module.css';

interface Magazine {
  id: string;
  title: string;
  slug: string;
  publishedText: string;
  description: string;
  pdfUrl: string;
  coverImageUrl: string;
  pages?: string[]; // Array of page image URLs
  fileSize: number;
  currentPage: number;
  totalPages: number;
  completed: boolean;
  lastReadAt: string | null;
}

export default function MagazinesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const flipBookRef = useRef<any>(null);

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
    setCurrentPage(magazine.currentPage || 0);
  };

  const handleCloseMagazine = async () => {
    if (selectedMagazine) {
      await updateProgress(selectedMagazine.id, currentPage);
    }
    setSelectedMagazine(null);
    setIsFullscreen(false);
  };

  const updateProgress = async (magazineId: string, page: number) => {
    try {
      await fetch('/api/dashboard/magazines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magazineId,
          currentPage: page,
          totalPages: selectedMagazine?.totalPages || 100,
          completed: page >= (selectedMagazine?.totalPages || 100) - 1,
        }),
      });
    } catch (error) {
    }
  };

  const handlePageFlip = (e: any) => {
    const newPage = e.data;
    setCurrentPage(newPage);
    if (selectedMagazine) {
      updateProgress(selectedMagazine.id, newPage);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const goToNextPage = () => {
    flipBookRef.current?.pageFlip().flipNext();
  };

  const goToPrevPage = () => {
    flipBookRef.current?.pageFlip().flipPrev();
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  // Generate placeholder pages if magazine doesn't have page images
  const getMagazinePages = (magazine: Magazine) => {
    if (magazine.pages && magazine.pages.length > 0) {
      return magazine.pages;
    }
    // Generate placeholder pages from cover image
    const pages = [magazine.coverImageUrl];
    for (let i = 1; i < magazine.totalPages; i++) {
      pages.push(magazine.coverImageUrl); // Use cover as placeholder
    }
    return pages;
  };

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

                      <div className={magazineStyles.magazineMeta}>
                        <span>{magazine.totalPages} pages</span>
                        <span>{formatFileSize(magazine.fileSize)}</span>
                      </div>

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
                        <a
                          href={magazine.pdfUrl}
                          download
                          className={magazineStyles.downloadBtn}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className={magazineStyles.icon}>⬇️</span>
                          Download PDF
                        </a>
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
            <div className={`${magazineStyles.flipbookReader} ${isFullscreen ? magazineStyles.fullscreen : ''}`}>
              <div className={magazineStyles.readerHeader}>
                <button className={magazineStyles.closeBtn} onClick={handleCloseMagazine}>
                  ← Back to Library
                </button>
                <h2 className={magazineStyles.readerTitle}>{selectedMagazine.title}</h2>
                <div className={magazineStyles.headerActions}>
                  <span className={magazineStyles.pageIndicator}>
                    Page {currentPage + 1} of {selectedMagazine.totalPages}
                  </span>
                  <button
                    className={magazineStyles.fullscreenBtn}
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isFullscreen ? '⤓' : '⤢'}
                  </button>
                </div>
              </div>

              <div className={magazineStyles.flipbookContainer}>
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={550}
                  height={733}
                  size="stretch"
                  minWidth={315}
                  maxWidth={1000}
                  minHeight={420}
                  maxHeight={1350}
                  maxShadowOpacity={0.5}
                  showCover={true}
                  mobileScrollSupport={true}
                  onFlip={handlePageFlip}
                  className={magazineStyles.flipbook}
                  style={{}}
                  startPage={currentPage}
                  drawShadow={true}
                  flippingTime={1000}
                  usePortrait={true}
                  startZIndex={0}
                  autoSize={true}
                  clickEventForward={true}
                  useMouseEvents={true}
                  swipeDistance={30}
                  showPageCorners={true}
                  disableFlipByClick={false}
                >
                  {getMagazinePages(selectedMagazine).map((pageUrl, index) => (
                    <div key={index} className={magazineStyles.page}>
                      <img
                        src={pageUrl}
                        alt={`Page ${index + 1}`}
                        className={magazineStyles.pageImage}
                      />
                      <div className={magazineStyles.pageNumber}>{index + 1}</div>
                    </div>
                  ))}
                </HTMLFlipBook>
              </div>

              <div className={magazineStyles.readerControls}>
                <button
                  className={magazineStyles.navBtn}
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                >
                  ← Previous
                </button>

                <div className={magazineStyles.controlsCenter}>
                  <span className={magazineStyles.pageInfo}>
                    Page {currentPage + 1} / {selectedMagazine.totalPages}
                  </span>
                </div>

                <button
                  className={magazineStyles.navBtn}
                  onClick={goToNextPage}
                  disabled={currentPage >= selectedMagazine.totalPages - 1}
                >
                  Next →
                </button>
              </div>

              <div className={magazineStyles.readerHint}>
                💡 Click or drag pages to flip • Use arrow keys • Pinch to zoom on mobile
              </div>
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
