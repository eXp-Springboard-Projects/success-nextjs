import { useState, useEffect } from 'react';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from '../../editorial/Editorial.module.css';
import Link from 'next/link';

interface Automation {
  id: string;
  name: string;
  trigger: string;
  status: string;
  total_runs: number;
  created_at: string;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/admin/crm/automations');
      if (res.ok) {
        const data = await res.json();
        setAutomations(data.automations || []);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const res = await fetch(`/api/admin/crm/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchAutomations();
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Automations">
        <div className={styles.loading}>Loading automations...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Automations">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Email Automations</h1>
            <p>Automated email workflows and sequences</p>
          </div>
          <Link href="/admin/crm/automations/new" className={styles.primaryButton}>
            + Create Automation
          </Link>
        </div>

        <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Automations</div>
            <div className={styles.statValue}>{automations.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active</div>
            <div className={styles.statValue}>
              {automations.filter(a => a.status === 'active').length}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Paused</div>
            <div className={styles.statValue}>
              {automations.filter(a => a.status === 'paused').length}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Runs</div>
            <div className={styles.statValue}>
              {automations.reduce((sum, a) => sum + a.total_runs, 0)}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          {automations.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚙️</div>
              <div>No automations yet. Create your first automation!</div>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Trigger</th>
                    <th>Status</th>
                    <th>Total Runs</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {automations.map((automation) => (
                    <tr key={automation.id}>
                      <td>
                        <Link href={`/admin/crm/automations/${automation.id}`} style={{ fontWeight: 600, color: '#3b82f6' }}>
                          {automation.name}
                        </Link>
                      </td>
                      <td>{automation.trigger}</td>
                      <td>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: automation.status === 'active' ? '#dcfce7' : '#f3f4f6',
                            color: automation.status === 'active' ? '#166534' : '#6b7280',
                          }}
                        >
                          {automation.status}
                        </span>
                      </td>
                      <td>{automation.total_runs.toLocaleString()}</td>
                      <td>{new Date(automation.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(automation.id, automation.status)}
                          className={styles.secondaryButton}
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          {automation.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
