import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Department } from '@prisma/client';
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
    <>
      <Head>
        <title>SUCCESS+ Dashboard Content - Admin</title>
      </Head>

      <DepartmentLayout
        currentDepartment={Department.SUCCESS_PLUS}
        pageTitle="SUCCESS+ Dashboard Content"
        description="Manage courses, resources, labs, and events"
      >
        <div className={styles.dashboard}>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🎓</div>
              <div className={styles.statInfo}>
                <h3>Courses</h3>
                <p className={styles.statNumber}>{stats.totalCourses}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📚</div>
              <div className={styles.statInfo}>
                <h3>Resources</h3>
                <p className={styles.statNumber}>{stats.totalResources}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔬</div>
              <div className={styles.statInfo}>
                <h3>Success Labs</h3>
                <p className={styles.statNumber}>{stats.totalLabs}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statInfo}>
                <h3>Events</h3>
                <p className={styles.statNumber}>{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className={styles.quickActions}>
            <h2>Quick Actions</h2>
            <div className={styles.actionsGrid}>
              <Link href="/admin/dashboard-content/courses" className={styles.actionCard}>
                <div className={styles.actionIcon}>🎓</div>
                <h3>Manage Courses</h3>
                <p>Create and edit courses, modules, and lessons</p>
              </Link>

              <Link href="/admin/dashboard-content/resources" className={styles.actionCard}>
                <div className={styles.actionIcon}>📚</div>
                <h3>Manage Resources</h3>
                <p>Upload and organize downloadable resources</p>
              </Link>

              <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" className={styles.actionCard}>
                <div className={styles.actionIcon}>🔬</div>
                <h3>SUCCESS Labs</h3>
                <p>Access interactive tools and AI-powered resources →</p>
              </a>

              <Link href="/admin/dashboard-content/events" className={styles.actionCard}>
                <div className={styles.actionIcon}>📅</div>
                <h3>Manage Events</h3>
                <p>Schedule webinars, workshops, and events</p>
              </Link>

              <Link href="/dashboard" className={styles.actionCard}>
                <div className={styles.actionIcon}>👁️</div>
                <h3>Preview Dashboard</h3>
                <p>View the SUCCESS+ member dashboard</p>
              </Link>

              <Link href="/admin/analytics" className={styles.actionCard}>
                <div className={styles.actionIcon}>📊</div>
                <h3>View Analytics</h3>
                <p>Track engagement and usage metrics</p>
              </Link>
            </div>
          </div>
        </div>
      </DepartmentLayout>
    </>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
