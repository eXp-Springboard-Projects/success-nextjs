import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@/lib/types';
import styles from './Sequences.module.css';

interface Sequence {
  id: string;
  name: string;
  description: string;
  steps: any[];
  status: string;
  total_enrolled: number;
  total_completed: number;
  total_replied: number;
  reply_rate: number;
  created_at: string;
}

export default function SequencesPage() {
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const res = await fetch('/api/admin/crm/sequences');
      const data = await res.json();
      setSequences(data.sequences || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Duplicate this sequence?')) return;

    try {
      const res = await fetch(`/api/admin/crm/sequences/${id}/duplicate`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchSequences();
      }
    } catch (error) {
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    try {
      await fetch(`/api/admin/crm/sequences/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchSequences();
    } catch (error) {
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this sequence? This action cannot be undone.')) return;

    try {
      await fetch(`/api/admin/crm/sequences/${id}`, {
        method: 'DELETE',
      });
      fetchSequences();
    } catch (error) {
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Sales Sequences">
        <div className={styles.loading}>Loading sequences...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Sales Sequences">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Sales Sequences</h1>
          <a href="/admin/crm/sequences/new" className={styles.addButton}>
            + New Sequence
          </a>
        </div>

        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Steps</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Reply Rate</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sequences.map((sequence) => (
                <tr
                  key={sequence.id}
                  onClick={() => router.push(`/admin/crm/sequences/${sequence.id}`)}
                >
                  <td>
                    <div className={styles.sequenceName}>{sequence.name}</div>
                    {sequence.description && (
                      <div className={styles.sequenceDescription}>
                        {sequence.description}
                      </div>
                    )}
                  </td>
                  <td>{sequence.steps?.length || 0} steps</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        sequence.status === 'active'
                          ? styles.statusActive
                          : sequence.status === 'paused'
                          ? styles.statusPaused
                          : styles.statusDraft
                      }`}
                    >
                      {sequence.status}
                    </span>
                  </td>
                  <td>
                    {sequence.total_enrolled}
                    {sequence.total_completed > 0 && (
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {' '}({sequence.total_completed} completed)
                      </span>
                    )}
                  </td>
                  <td>
                    {sequence.reply_rate > 0 ? (
                      <span style={{ fontWeight: 600, color: '#22c55e' }}>
                        {sequence.reply_rate.toFixed(1)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{formatDate(sequence.created_at)}</td>
                  <td>
                    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                      {sequence.status === 'draft' && (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => handleToggleStatus(sequence.id, sequence.status, e)}
                        >
                          Activate
                        </button>
                      )}
                      {sequence.status === 'active' && (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => handleToggleStatus(sequence.id, sequence.status, e)}
                        >
                          Pause
                        </button>
                      )}
                      {sequence.status === 'paused' && (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => handleToggleStatus(sequence.id, sequence.status, e)}
                        >
                          Resume
                        </button>
                      )}
                      <button
                        className={styles.actionButton}
                        onClick={(e) => handleDuplicate(sequence.id, e)}
                      >
                        Duplicate
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={(e) => handleDelete(sequence.id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sequences.length === 0 && (
            <div className={styles.empty}>
              No sequences yet. Click "New Sequence" to create your first sales sequence.
            </div>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}
