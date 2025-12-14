import { useEffect, useState } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './Coaching.module.css';

interface DashboardStats {
  activeClients: number;
  sessionsThisWeek: number;
  programsRunning: number;
  coachUtilization: number;
  todaysSessions: Array<{
    id: string;
    time: string;
    clientName: string;
    coachName: string;
    status: string;
  }>;
}

export default function CoachingDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    sessionsThisWeek: 0,
    programsRunning: 0,
    coachUtilization: 0,
    todaysSessions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/coaching/dashboard-stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch dashboard stats:', error);
        setLoading(false);
      });
  }, []);

  return (
    <DepartmentLayout
      currentDepartment={Department.COACHING}
      pageTitle="Coaching Dashboard"
      description="Programs, sessions, and client management"
    >
      <div className={styles.dashboard}>
        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Active Clients</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.activeClients}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Sessions This Week</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.sessionsThisWeek}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Programs Running</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.programsRunning}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Coach Utilization</div>
              <div className={styles.statValue}>
                {loading ? '...' : `${stats.coachUtilization.toFixed(0)}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <a
              href="https://coaching.success.com/auth"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionCard}
            >
              <div className={styles.actionIcon}>🚀</div>
              <div className={styles.actionTitle}>Launch Coaching Portal</div>
              <div className={styles.actionDescription}>
                Access the SUCCESS Coaching platform
              </div>
            </a>

            <a
              href="https://coaching.success.com/auth"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionCard}
            >
              <div className={styles.actionIcon}>👥</div>
              <div className={styles.actionTitle}>Manage Clients</div>
              <div className={styles.actionDescription}>
                View and manage coaching clients
              </div>
            </a>

            <a
              href="https://coaching.success.com/auth"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionCard}
            >
              <div className={styles.actionIcon}>📅</div>
              <div className={styles.actionTitle}>Schedule & Sessions</div>
              <div className={styles.actionDescription}>
                Book and manage coaching sessions
              </div>
            </a>

            <a
              href="https://coaching.success.com/auth"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionCard}
            >
              <div className={styles.actionIcon}>👨‍🏫</div>
              <div className={styles.actionTitle}>Coach Directory</div>
              <div className={styles.actionDescription}>
                View coach profiles and availability
              </div>
            </a>

            <a
              href="https://coaching.success.com/auth"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionCard}
            >
              <div className={styles.actionIcon}>🎯</div>
              <div className={styles.actionTitle}>Programs & Curriculum</div>
              <div className={styles.actionDescription}>
                Manage coaching programs and content
              </div>
            </a>

            <a
              href="https://coaching.success.com/auth"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionCard}
            >
              <div className={styles.actionIcon}>📊</div>
              <div className={styles.actionTitle}>Analytics & Reports</div>
              <div className={styles.actionDescription}>
                View coaching performance metrics
              </div>
            </a>
          </div>
        </div>

        {/* Today's Sessions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Today's Sessions</h2>
          <div className={styles.sessionsList}>
            {loading ? (
              <div className={styles.emptyState}>Loading...</div>
            ) : stats.todaysSessions.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                <div>No sessions scheduled for today</div>
              </div>
            ) : (
              stats.todaysSessions.map((session) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'Scheduled': return '#3b82f6';
                    case 'Completed': return '#10b981';
                    case 'Cancelled': return '#ef4444';
                    case 'No-Show': return '#f59e0b';
                    default: return '#6b7280';
                  }
                };

                return (
                  <div key={session.id} className={styles.sessionItem}>
                    <div className={styles.sessionTime}>{session.time}</div>
                    <div className={styles.sessionContent}>
                      <div className={styles.sessionClient}>{session.clientName}</div>
                      <div className={styles.sessionCoach}>with {session.coachName}</div>
                    </div>
                    <div
                      className={styles.sessionStatus}
                      style={{ background: getStatusColor(session.status) }}
                    >
                      {session.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.COACHING);
