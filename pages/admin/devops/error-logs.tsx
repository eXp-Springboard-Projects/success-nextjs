import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import ConfirmationModal from '../../../components/admin/ConfirmationModal';
import styles from './ErrorLogs.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface ErrorLog {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  page: string;
  userAgent: string;
  stack?: string;
}

export default function ErrorLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [pageFilter, setPageFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
      router.push('/admin');
      return;
    }
    fetchLogs();
  }, [session]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/devops/error-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/admin/devops/error-logs/clear', {
        method: 'POST',
      });

      if (res.ok) {
        alert('Logs cleared successfully!');
        fetchLogs();
      } else {
        alert('Failed to clear logs');
      }
    } catch (error) {
      alert('Failed to clear logs');
    } finally {
      setShowClearModal(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (pageFilter && !log.page.toLowerCase().includes(pageFilter.toLowerCase())) return false;
    if (dateFilter) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate !== dateFilter) return false;
    }
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#991b1b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading error logs...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Error Logs Viewer</h1>
            <p className={styles.subtitle}>Monitor and manage application errors</p>
          </div>
          <button
            className={styles.clearButton}
            onClick={() => setShowClearModal(true)}
          >
            🗑️ Clear Logs
          </button>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="severity" className={styles.filterLabel}>Severity:</label>
            <select
              id="severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="page" className={styles.filterLabel}>Page:</label>
            <input
              id="page"
              type="text"
              value={pageFilter}
              onChange={(e) => setPageFilter(e.target.value)}
              className={styles.filterInput}
              placeholder="Filter by page..."
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="date" className={styles.filterLabel}>Date:</label>
            <input
              id="date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterStats}>
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>

        <div className={styles.logsContainer}>
          {filteredLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No error logs found</p>
            </div>
          ) : (
            <div className={styles.logsList}>
              {filteredLogs.map((log) => (
                <div key={log.id} className={styles.logCard}>
                  <div className={styles.logHeader}>
                    <div className={styles.logMeta}>
                      <span
                        className={styles.severityBadge}
                        style={{ backgroundColor: getSeverityColor(log.severity) }}
                      >
                        {log.severity.toUpperCase()}
                      </span>
                      <span className={styles.timestamp}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className={styles.page}>{log.page}</span>
                    </div>
                    {log.stack && (
                      <button
                        className={styles.expandButton}
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        {expandedLog === log.id ? '▼ Hide Details' : '▶ Show Details'}
                      </button>
                    )}
                  </div>

                  <div className={styles.logMessage}>{log.message}</div>

                  {expandedLog === log.id && log.stack && (
                    <div className={styles.logStack}>
                      <strong>Stack Trace:</strong>
                      <pre>{log.stack}</pre>
                    </div>
                  )}

                  <div className={styles.logFooter}>
                    <span className={styles.userAgent}>{log.userAgent}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear Logs Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearLogs}
        title="Clear All Logs"
        message="Are you sure you want to clear all error logs? This action cannot be undone."
        confirmText="Clear Logs"
        confirmationType="medium"
        actionType="caution"
      />
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
