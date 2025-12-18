import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import styles from './Search.module.css';

export default function SearchPage() {
  const router = useRouter();
  const { q, category, type, sort, page } = router.query;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: 'all',
    type: 'post',
    sort: 'relevance',
  });

  useEffect(() => {
    if (q && typeof q === 'string') {
      setSearchQuery(q);
      performSearch();
    }
  }, [q, category, type, sort, page]);

  const performSearch = async () => {
    if (!q || !(q as string).trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: q as string,
        category: (category as string) || 'all',
        type: (type as string) || 'post',
        sort: (sort as string) || 'relevance',
        page: (page as string) || '1',
      });

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
        setFilters({
          category: data.filters.category || 'all',
          type: data.filters.type || 'post',
          sort: data.filters.sort || 'relevance',
        });
      }
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const query: any = { q, [key]: value };
    if (key !== 'page') query.page = '1';
    router.push({ pathname: '/search', query });
  };

  const handlePageChange = (newPage: number) => {
    router.push({ pathname: '/search', query: { ...router.query, page: newPage.toString() } });
  };

  return (
    <Layout>
      <div className={styles.searchPage}>
        <div className={styles.searchHeader}>
          <h1 className={styles.title}>Search</h1>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className={styles.searchInput}
              autoFocus
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>

        {q && (
          <div className={styles.filters}>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="post">Articles</option>
              <option value="video">Videos</option>
              <option value="podcast">Podcasts</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="relevance">Relevance</option>
              <option value="date">Newest</option>
              <option value="views">Popular</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              <option value="business">Business</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="money">Money</option>
              <option value="health-wellness">Health & Wellness</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Searching...</div>
        ) : results.length > 0 ? (
          <div className={styles.resultsContainer}>
            <h2 className={styles.resultsTitle}>
              {total.toLocaleString()} {total === 1 ? 'result' : 'results'} for "{q}"
            </h2>
            <div className={styles.resultsGrid}>
              {results.map((post: any) => (
                <PostCard key={post.id} post={{ ...post, featured_media_url: post.featuredImage }} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.pageButton}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.pageButton}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : q ? (
          <div className={styles.noResults}>
            <p>No results found for "{q}"</p>
            <p className={styles.suggestion}>Try different keywords or check your spelling.</p>
          </div>
        ) : (
          <div className={styles.noResults}>
            <p>Enter a search term to find articles</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Force SSR for AWS Amplify deployment compatibility
export async function getServerSideProps() {
  return {
    props: {},
  };
}
