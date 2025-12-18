/**
 * Posts List with Filters, Search, and Bulk Actions
 *
 * Complete WordPress-style posts management interface
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import QuickEdit from './QuickEdit';
import styles from './PostsListWithFilters.module.css';

interface Post {
  id: string | number;
  title: { rendered: string };
  slug: string;
  status: string;
  date: string;
  _embedded?: {
    author?: Array<{ name: string; id: number }>;
    'wp:author'?: Array<{ name: string; id: number }>;
    'wp:term'?: Array<Array<{ name: string; id: number }>>;
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
  };
}

interface Author {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function PostsListWithFilters() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<string | number>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [processing, setProcessing] = useState(false);
  const [quickEditPostId, setQuickEditPostId] = useState<string | number | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Lists for filters
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchPosts();
    fetchAuthors();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, searchQuery, statusFilter, authorFilter, categoryFilter, dateFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/posts?per_page=500&status=all');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const res = await fetch('/api/users?per_page=100&role=ADMIN,EDITOR,AUTHOR');
      if (res.ok) {
        const data = await res.json();
        setAuthors(data);
      }
    } catch (error) {
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?per_page=100');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.rendered.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Author filter
    if (authorFilter !== 'all') {
      filtered = filtered.filter(post => {
        const author = post._embedded?.author?.[0] || post._embedded?.['wp:author']?.[0];
        return author?.id === parseInt(authorFilter);
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(post => {
        const categories = post._embedded?.['wp:term']?.[0] || [];
        return categories.some((cat: any) => cat.id === parseInt(categoryFilter));
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === '7days') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === '30days') {
        filterDate.setDate(now.getDate() - 30);
      } else if (dateFilter === 'thismonth') {
        filterDate.setDate(1);
      }

      filtered = filtered.filter(post => new Date(post.date) >= filterDate);
    }

    setFilteredPosts(filtered);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredPosts.map(p => p.id);
      setSelectedPosts(new Set(allIds));
    } else {
      setSelectedPosts(new Set());
    }
  };

  const handleSelectPost = (postId: string | number) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPosts.size === 0) {
      alert('Please select posts and choose an action');
      return;
    }

    const confirmMessages: { [key: string]: string } = {
      'publish': `Publish ${selectedPosts.size} post(s)?`,
      'draft': `Move ${selectedPosts.size} post(s) to draft?`,
      'delete': `⚠️ DELETE ${selectedPosts.size} post(s)? This cannot be undone!`,
      'trash': `Move ${selectedPosts.size} post(s) to trash?`,
    };

    if (!confirm(confirmMessages[bulkAction])) {
      return;
    }

    setProcessing(true);

    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(`Successfully ${bulkAction === 'delete' ? 'deleted' : 'updated'} ${selectedPosts.size} post(s)\n\nNote: This is a demo. To actually modify posts, you need to implement the WordPress REST API integration with authentication.`);

      // Clear selection
      setSelectedPosts(new Set());
      setBulkAction('');

      // In real implementation: fetchPosts();
    } catch (error) {
      alert('Failed to perform bulk action');
    } finally {
      setProcessing(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setAuthorFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
  };

  const handleQuickEditSave = async (updatedPost: any) => {
    alert(`Quick Edit Save:\n\nPost ID: ${updatedPost.id}\nTitle: ${updatedPost.title}\nStatus: ${updatedPost.status}\n\nNote: This is a demo. To actually save changes, you need to implement the WordPress REST API integration with authentication.`);

    // Update local state
    setPosts(posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    setQuickEditPostId(null);

    // In real implementation:
    // await fetch(`/api/posts/${updatedPost.id}`, { method: 'PATCH', body: JSON.stringify(updatedPost) });
    // fetchPosts();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusCounts = () => {
    const counts = {
      all: posts.length,
      publish: posts.filter(p => p.status === 'publish').length,
      draft: posts.filter(p => p.status === 'draft').length,
      pending: posts.filter(p => p.status === 'pending').length,
      future: posts.filter(p => p.status === 'future').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();
  const allSelected = filteredPosts.length > 0 && selectedPosts.size === filteredPosts.length;
  const someSelected = selectedPosts.size > 0 && selectedPosts.size < filteredPosts.length;

  return (
    <div className={styles.container}>
      {/* Header with New Post Button */}
      <div className={styles.header}>
        <h1>Posts</h1>
        <Link href="/admin/posts/new" className={styles.newPostButton}>
          ✏️ Add New Post
        </Link>
      </div>

      {/* Status Tabs */}
      <div className={styles.statusTabs}>
        <button
          className={statusFilter === 'all' ? styles.activeTab : styles.tab}
          onClick={() => setStatusFilter('all')}
        >
          All ({statusCounts.all})
        </button>
        {statusCounts.publish > 0 && (
          <button
            className={statusFilter === 'publish' ? styles.activeTab : styles.tab}
            onClick={() => setStatusFilter('publish')}
          >
            Published ({statusCounts.publish})
          </button>
        )}
        {statusCounts.draft > 0 && (
          <button
            className={statusFilter === 'draft' ? styles.activeTab : styles.tab}
            onClick={() => setStatusFilter('draft')}
          >
            Draft ({statusCounts.draft})
          </button>
        )}
        {statusCounts.pending > 0 && (
          <button
            className={statusFilter === 'pending' ? styles.activeTab : styles.tab}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({statusCounts.pending})
          </button>
        )}
        {statusCounts.future > 0 && (
          <button
            className={statusFilter === 'future' ? styles.activeTab : styles.tab}
            onClick={() => setStatusFilter('future')}
          >
            Scheduled ({statusCounts.future})
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        {/* Search */}
        <input
          type="search"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        {/* Author Filter */}
        <select
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Authors</option>
          {authors.map(author => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Dates</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="thismonth">This Month</option>
        </select>

        {/* Clear Filters */}
        {(searchQuery || statusFilter !== 'all' || authorFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all') && (
          <button onClick={clearFilters} className={styles.clearButton}>
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <div className={styles.bulkActionsBar}>
        <div className={styles.bulkActionsLeft}>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className={styles.bulkSelect}
            disabled={selectedPosts.size === 0}
          >
            <option value="">Bulk Actions</option>
            <option value="publish">Publish</option>
            <option value="draft">Move to Draft</option>
            <option value="trash">Move to Trash</option>
            <option value="delete">Delete Permanently</option>
          </select>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction || selectedPosts.size === 0 || processing}
            className={styles.applyButton}
          >
            {processing ? 'Processing...' : 'Apply'}
          </button>
          {selectedPosts.size > 0 && (
            <span className={styles.selectedCount}>
              {selectedPosts.size} item{selectedPosts.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <div className={styles.bulkActionsRight}>
          {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Posts Table */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className={styles.empty}>
          <p>No posts found</p>
          {searchQuery && <button onClick={() => setSearchQuery('')}>Clear search</button>}
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCol}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ width: '60px' }}></th>
              <th>Title</th>
              <th>Author</th>
              <th>Categories</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map(post => {
              const author = post._embedded?.author?.[0] || post._embedded?.['wp:author']?.[0];
              const postCategories = post._embedded?.['wp:term']?.[0] || [];
              const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];

              return (
                <>
                <tr key={post.id} className={selectedPosts.has(post.id) ? styles.selectedRow : ''}>
                  <td className={styles.checkboxCol}>
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post.id)}
                      onChange={() => handleSelectPost(post.id)}
                    />
                  </td>
                  <td>
                    {featuredImage?.source_url ? (
                      <img
                        src={featuredImage.source_url}
                        alt={featuredImage.alt_text || ''}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: '#9ca3af'
                      }}>
                        📄
                      </div>
                    )}
                  </td>
                  <td className={styles.titleCol}>
                    <Link href={`/admin/posts/${post.id}/edit`} className={styles.postTitle}>
                      {post.title.rendered || 'Untitled'}
                    </Link>
                    <div className={styles.rowActions}>
                      <Link href={`/admin/posts/${post.id}/edit`}>Edit</Link>
                      <span className={styles.separator}>|</span>
                      <button
                        onClick={() => setQuickEditPostId(post.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          cursor: 'pointer',
                          padding: 0,
                          font: 'inherit',
                          textDecoration: 'none'
                        }}
                      >
                        Quick Edit
                      </button>
                      <span className={styles.separator}>|</span>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </div>
                  </td>
                  <td>{author?.name || 'Unknown'}</td>
                  <td>
                    {postCategories.length > 0
                      ? postCategories.map((cat: any) => cat.name).join(', ')
                      : '—'}
                  </td>
                  <td>
                    <div>{formatDate(post.date)}</div>
                  </td>
                  <td>
                    <span className={`${styles.status} ${styles[post.status]}`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                  </td>
                </tr>

                {/* Quick Edit Row */}
                {quickEditPostId === post.id && (
                  <QuickEdit
                    post={post}
                    categories={categories}
                    onSave={handleQuickEditSave}
                    onCancel={() => setQuickEditPostId(null)}
                  />
                )}
                </>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
