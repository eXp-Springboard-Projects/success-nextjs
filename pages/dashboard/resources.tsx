import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Download, FileText, FileSpreadsheet, File, Archive, Search, Filter } from 'lucide-react';
import styles from './Resources.module.css';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  linkUrl?: string;
  fileType: string;
  fileSize?: number;
  thumbnail?: string;
  downloads: number;
  createdAt: string;
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
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      const timer = setTimeout(() => fetchResources(), 300);
      return () => clearTimeout(timer);
    }
  }, [categoryFilter, search]);

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
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      // Track the download
      await fetch('/api/dashboard/resources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: resource.id }),
      });

      // Open the file or link
      const url = resource.linkUrl || resource.fileUrl;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className={styles.fileIcon} />;
      case 'docx':
      case 'doc':
        return <FileText className={styles.fileIcon} />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className={styles.fileIcon} />;
      case 'zip':
      case 'rar':
        return <Archive className={styles.fileIcon} />;
      case 'link':
        return <File className={styles.fileIcon} />;
      default:
        return <File className={styles.fileIcon} />;
    }
  };

  const categories = ['TEMPLATES', 'GUIDES', 'WORKSHEETS', 'EBOOKS', 'TOOLS', 'CHECKLISTS'];

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading resources...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Resources - SUCCESS+ Dashboard</title>
        <meta name="description" content="Access exclusive downloadable templates, guides, and tools" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Resource Library</h1>
            <p className={styles.subtitle}>
              Exclusive downloads, templates, and tools for SUCCESS+ members
            </p>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.categoryFilter}>
            <Filter className={styles.filterIcon} />
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
        </div>

        {resources.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <File className={styles.emptyIcon} />
            <h2>No resources found</h2>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={styles.resourcesGrid}>
            {resources.map((resource) => (
              <div key={resource.id} className={styles.resourceCard}>
                <div className={styles.cardHeader}>
                  {resource.thumbnail ? (
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className={styles.thumbnail}
                    />
                  ) : (
                    <div className={styles.iconPlaceholder}>
                      {getFileIcon(resource.fileType)}
                    </div>
                  )}
                  <div className={styles.categoryBadge}>
                    {resource.category.charAt(0) + resource.category.slice(1).toLowerCase()}
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.title}>{resource.title}</h3>
                  <p className={styles.description}>{resource.description}</p>

                  <div className={styles.meta}>
                    {resource.fileType && (
                      <span className={styles.metaItem}>
                        {resource.fileType.toUpperCase()}
                      </span>
                    )}
                    {resource.fileSize && (
                      <span className={styles.metaItem}>
                        {formatFileSize(resource.fileSize)}
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      {resource.downloads} downloads
                    </span>
                  </div>
                </div>

                <button
                  className={styles.downloadButton}
                  onClick={() => handleDownload(resource)}
                >
                  <Download size={18} />
                  {resource.linkUrl ? 'Open Link' : 'Download'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
