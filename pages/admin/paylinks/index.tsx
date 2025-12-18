import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import styles from './PayLinks.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface PayLink {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'ARCHIVED';
  currentUses: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
  isExpired?: boolean;
  isMaxedOut?: boolean;
}

export default function AdminPayLinks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [paylinks, setPaylinks] = useState<PayLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [slug, setSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [requiresShipping, setRequiresShipping] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPayLinks();
    }
  }, [session, filter, searchTerm]);

  const fetchPayLinks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/paylinks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPaylinks(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !amount || !slug) {
      alert('Title, amount, and slug are required');
      return;
    }

    if (parseFloat(amount) <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    setSaving(true);

    const paylinkData = {
      title,
      description: description || null,
      amount: parseFloat(amount),
      currency: 'USD',
      slug,
      expiresAt: expiresAt || null,
      maxUses: maxUses ? parseInt(maxUses) : null,
      requiresShipping,
    };

    try {
      const res = await fetch('/api/paylinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paylinkData),
      });

      if (res.ok) {
        await fetchPayLinks();
        resetForm();
        setShowCreateForm(false);
        alert('Payment link created successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create payment link');
      }
    } catch (error) {
      alert('Failed to create payment link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment link?')) return;

    try {
      const res = await fetch(`/api/paylinks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPaylinks(paylinks.filter(p => p.id !== id));
      } else {
        alert('Failed to delete payment link');
      }
    } catch (error) {
      alert('Failed to delete payment link');
    }
  };

  const toggleStatus = async (paylink: PayLink) => {
    const newStatus = paylink.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const res = await fetch(`/api/paylinks/${paylink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchPayLinks();
      }
    } catch (error) {
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setSlug('');
    setExpiresAt('');
    setMaxUses('');
    setRequiresShipping(false);
  };

  const copyLinkToClipboard = (slug: string) => {
    const url = `${window.location.origin}/pay/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading payment links...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  const stats = {
    total: paylinks.length,
    active: paylinks.filter(p => p.status === 'ACTIVE' && !p.isExpired && !p.isMaxedOut).length,
    expired: paylinks.filter(p => p.isExpired).length,
    maxedOut: paylinks.filter(p => p.isMaxedOut).length,
    totalRevenue: paylinks.reduce((sum, p) => sum + (Number(p.amount) * p.currentUses), 0),
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Payment Links</h1>
            <p className={styles.subtitle}>Create and manage secure payment links</p>
          </div>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className={styles.createButton}
            >
              + Create Payment Link
            </button>
          )}
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Links</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active</div>
            <div className={styles.statValue}>{stats.active}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Revenue</div>
            <div className={styles.statValue}>${stats.totalRevenue.toFixed(2)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Expired/Maxed</div>
            <div className={styles.statValue}>{stats.expired + stats.maxedOut}</div>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2>Create New Payment Link</h2>
              <button onClick={() => { setShowCreateForm(false); resetForm(); }} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="title">Title *</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., Black Friday Special"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="amount">Amount (USD) *</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="99.99"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="slug">URL Slug *</label>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="black-friday-special"
                  className={styles.input}
                  required
                />
                <small>URL will be: {window.location.origin}/pay/{slug || 'your-slug'}</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of what this payment is for"
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="expiresAt">Expires At (Optional)</label>
                  <input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="maxUses">Max Uses (Optional)</label>
                  <input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Leave blank for unlimited"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={requiresShipping}
                    onChange={(e) => setRequiresShipping(e.target.checked)}
                  />
                  <span>Requires shipping address</span>
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" disabled={saving} className={styles.saveButton}>
                  {saving ? 'Creating...' : 'Create Payment Link'}
                </button>
                <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.filterButtons}>
            <button
              onClick={() => setFilter('all')}
              className={`${styles.filterButton} ${filter === 'all' ? styles.filterButtonActive : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`${styles.filterButton} ${filter === 'ACTIVE' ? styles.filterButtonActive : ''}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('INACTIVE')}
              className={`${styles.filterButton} ${filter === 'INACTIVE' ? styles.filterButtonActive : ''}`}
            >
              Inactive
            </button>
            <button
              onClick={() => setFilter('EXPIRED')}
              className={`${styles.filterButton} ${filter === 'EXPIRED' ? styles.filterButtonActive : ''}`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          {paylinks.length === 0 ? (
            <div className={styles.empty}>
              <p>No payment links yet. Create your first one!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Slug</th>
                  <th>Uses</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paylinks.map((paylink) => (
                  <tr key={paylink.id}>
                    <td className={styles.titleCell}>{paylink.title}</td>
                    <td>${Number(paylink.amount).toFixed(2)}</td>
                    <td className={styles.slugCell}>/pay/{paylink.slug}</td>
                    <td>
                      {paylink.currentUses}
                      {paylink.maxUses && ` / ${paylink.maxUses}`}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${paylink.status}`]}`}>
                        {paylink.isExpired ? 'EXPIRED' : paylink.isMaxedOut ? 'MAXED OUT' : paylink.status}
                      </span>
                    </td>
                    <td>{new Date(paylink.createdAt).toLocaleDateString()}</td>
                    <td className={styles.actions}>
                      <button
                        onClick={() => copyLinkToClipboard(paylink.slug)}
                        className={styles.copyButton}
                        title="Copy link"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => toggleStatus(paylink)}
                        className={styles.toggleButton}
                        title={paylink.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {paylink.status === 'ACTIVE' ? '⏸️' : '▶️'}
                      </button>
                      <Link href={`/pay/${paylink.slug}`} target="_blank" className={styles.viewButton}>
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(paylink.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
