import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import styles from '../styles/Resources.module.css';

interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  featured: boolean;
}

const CATEGORIES = [
  'All Resources',
  'Guides & Workbooks',
  'Leadership & Management',
  'Planners & Trackers',
  'Finance & Money',
  'Career Development',
  'Personal Growth',
  'Business & Entrepreneurship',
  'Health & Wellness',
  'Seasonal & Holiday'
];

export default function ResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Resources');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/resources');
      return;
    }

    if (status === 'authenticated') {
      fetchResources();
    }
  }, [status, router]);

  useEffect(() => {
    filterResources();
  }, [resources, selectedCategory, searchQuery]);

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/resources');
      const data = await res.json();
      setResources(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (selectedCategory !== 'All Resources') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    setFilteredResources(filtered);
  };

  const handleDownload = async (resource: Resource) => {
    // Track download
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: resource.id })
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }

    // Open PDF in new tab
    window.open(resource.fileUrl, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className={styles.loading}>Loading resources...</div>
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>SUCCESS+ Resources</h1>
            <p className={styles.heroSubtitle}>
              Exclusive downloadable guides, workbooks, planners, and tools to help you achieve your goals
            </p>
          </div>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.sidebar}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.categories}>
              <h3 className={styles.categoriesTitle}>Categories</h3>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? styles.categoryButtonActive
                      : styles.categoryButton
                  }
                >
                  {category}
                  {category !== 'All Resources' && (
                    <span className={styles.categoryCount}>
                      ({resources.filter(r => r.category === category).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.mainContent}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                {selectedCategory}
              </h2>
              <p className={styles.resultsCount}>
                {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredResources.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No resources found matching your criteria.</p>
              </div>
            ) : (
              <div className={styles.resourceGrid}>
                {filteredResources.map(resource => (
                  <div key={resource.id} className={styles.resourceCard}>
                    <div className={styles.resourceIcon}>
                      📄
                    </div>
                    <h3 className={styles.resourceTitle}>{resource.title}</h3>
                    {resource.description && (
                      <p className={styles.resourceDescription}>
                        {resource.description}
                      </p>
                    )}
                    <div className={styles.resourceMeta}>
                      <span className={styles.resourceCategory}>
                        {resource.category}
                      </span>
                      <span className={styles.resourceSize}>
                        {formatFileSize(resource.fileSize)}
                      </span>
                    </div>
                    <div className={styles.resourceFooter}>
                      <button
                        onClick={() => handleDownload(resource)}
                        className={styles.downloadButton}
                      >
                        📥 Download PDF
                      </button>
                      {resource.downloadCount > 0 && (
                        <span className={styles.downloadCount}>
                          {resource.downloadCount} download{resource.downloadCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
