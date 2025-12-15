import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  thumbnail: string;
  downloads: number;
}

export default function ResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/resources');
    } else if (status === 'authenticated') {
      fetchResources();
    }
  }, [status, categoryFilter, search]);

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/dashboard/resources?${params}`);

      if (response.status === 403) {
        router.push('/subscribe?error=subscription_required');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      // Track the download
      await fetch('/api/dashboard/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: resource.id }),
      });

      // Open the file in a new tab
      window.open(resource.fileUrl, '_blank');
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const categories = ['TEMPLATES', 'GUIDES', 'WORKSHEETS', 'EBOOKS', 'TOOLS', 'CHECKLISTS'];

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Resources - SUCCESS+ Dashboard</title>
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
              <button className={styles.active}><span className={styles.icon}>📚</span> Resources</button>
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
              <button><span className={styles.icon}>📖</span> Magazines</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Resource Library</h1>
            <p className={styles.subtitle}>Downloadable templates, guides, and tools</p>
          </div>

          <div className={styles.searchFilters}>
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.resourcesGrid}>
            {resources.map((resource) => (
              <div key={resource.id} className={styles.resourceCard}>
                <div className={styles.resourceIcon}>
                  {resource.thumbnail ? (
                    <img src={resource.thumbnail} alt={resource.title} />
                  ) : (
                    <div className={styles.fileIcon}>
                      {resource.fileType === 'pdf' && '📄'}
                      {resource.fileType === 'docx' && '📝'}
                      {resource.fileType === 'xlsx' && '📊'}
                      {resource.fileType === 'zip' && '📦'}
                      {!['pdf', 'docx', 'xlsx', 'zip'].includes(resource.fileType) && '📁'}
                    </div>
                  )}
                </div>

                <div className={styles.resourceContent}>
                  <div className={styles.resourceCategory}>
                    {resource.category.charAt(0) + resource.category.slice(1).toLowerCase()}
                  </div>
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>

                  <div className={styles.resourceMeta}>
                    <span>{resource.fileType.toUpperCase()}</span>
                    <span>{formatFileSize(resource.fileSize || 0)}</span>
                    <span>{resource.downloads} downloads</span>
                  </div>

                  <button
                    className={styles.downloadBtn}
                    onClick={() => handleDownload(resource)}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {resources.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <p>No resources found matching your search.</p>
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
