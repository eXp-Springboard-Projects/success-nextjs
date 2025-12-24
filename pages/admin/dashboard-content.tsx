import { useState } from 'react';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './DashboardContent.module.css';

export default function DashboardContent() {
  const [stats] = useState({
    totalCourses: 0,
    totalResources: 0,
    totalLabs: 0,
    totalEvents: 0,
  });

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="SUCCESS+ Dashboard Content"
      description="Manage courses, resources, labs, and events"
    >
      <div className={styles.dashboard}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎓</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Courses</div>
              <div className={styles.statValue}>{stats.totalCourses}</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Resources</div>
              <div className={styles.statValue}>{stats.totalResources}</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔬</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>SUCCESS Labs</div>
              <div className={styles.statValue}>{stats.totalLabs}</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Events</div>
              <div className={styles.statValue}>{stats.totalEvents}</div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link href="/admin/dashboard-content/courses" className={styles.actionCard}>
              <div className={styles.actionIcon}>🎓</div>
              <div className={styles.actionTitle}>Manage Courses</div>
              <div className={styles.actionDescription}>
                Create and edit courses, modules, and lessons
              </div>
            </Link>

            <Link href="/admin/dashboard-content/resources" className={styles.actionCard}>
              <div className={styles.actionIcon}>📚</div>
              <div className={styles.actionTitle}>Manage Resources</div>
              <div className={styles.actionDescription}>
                Upload and organize downloadable resources
              </div>
            </Link>

            <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" className={styles.actionCard}>
              <div className={styles.actionIcon}>🔬</div>
              <div className={styles.actionTitle}>SUCCESS Labs</div>
              <div className={styles.actionDescription}>
                Access interactive tools and AI-powered resources →
              </div>
            </a>

            <Link href="/admin/dashboard-content/events" className={styles.actionCard}>
              <div className={styles.actionIcon}>📅</div>
              <div className={styles.actionTitle}>Manage Events</div>
              <div className={styles.actionDescription}>
                Schedule webinars, workshops, and events
              </div>
            </Link>

            <Link href="/dashboard" className={styles.actionCard}>
              <div className={styles.actionIcon}>👁️</div>
              <div className={styles.actionTitle}>Preview Dashboard</div>
              <div className={styles.actionDescription}>
                View the SUCCESS+ member dashboard
              </div>
            </Link>

            <Link href="/admin/analytics" className={styles.actionCard}>
              <div className={styles.actionIcon}>📊</div>
              <div className={styles.actionTitle}>View Analytics</div>
              <div className={styles.actionDescription}>
                Track engagement and usage metrics
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
