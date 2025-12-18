import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from './Forms.module.css';

interface Form {
  id: string;
  name: string;
  status: string;
  submissions: number;
  createdAt: string;
  updatedAt: string;
}

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchForms();
  }, [statusFilter]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/crm/forms?${params}`);
      const data = await res.json();
      setForms(data.forms || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? All submissions will be permanently deleted.')) return;

    try {
      const res = await fetch(`/api/admin/crm/forms/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchForms();
      } else {
        alert('Failed to delete form');
      }
    } catch (error) {
      alert('Error deleting form');
    }
  };

  const duplicateForm = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/crm/forms/${id}/duplicate`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/crm/forms/${data.id}`);
      } else {
        alert('Failed to duplicate form');
      }
    } catch (error) {
      alert('Error duplicating form');
    }
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Forms</h1>
            <p>Create and manage lead capture forms</p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => router.push('/admin/crm/forms/new')}
          >
            + Create Form
          </button>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Form Name</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyState}>
                      {searchQuery ? 'No forms match your search' : 'No forms yet. Create your first form to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredForms.map((form) => (
                    <tr key={form.id}>
                      <td>
                        <strong>{form.name}</strong>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge${form.status.charAt(0).toUpperCase() + form.status.slice(1)}`]}`}>
                          {form.status}
                        </span>
                      </td>
                      <td>{form.submissions.toLocaleString()}</td>
                      <td>{new Date(form.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionButton}
                            onClick={() => router.push(`/admin/crm/forms/${form.id}/submissions`)}
                            title="View Submissions"
                          >
                            View
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() => router.push(`/admin/crm/forms/${form.id}`)}
                            title="Edit Form"
                          >
                            Edit
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() => duplicateForm(form.id)}
                            title="Duplicate Form"
                          >
                            Duplicate
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => deleteForm(form.id)}
                            title="Delete Form"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
