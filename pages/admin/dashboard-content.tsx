import { useState } from 'react';
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
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="SUCCESS+ Dashboard Content"
      description="Manage courses, resources, labs, and events"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e5e7eb' }}>
            <div className={styles.statIcon}>🎓</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Courses</div>
              <div className={styles.statValue}>{stats.totalCourses}</div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e5e7eb' }}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Resources</div>
              <div className={styles.statValue}>{stats.totalResources}</div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e5e7eb' }}>
            <div className={styles.statIcon}>🔬</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Success Labs</div>
              <div className={styles.statValue}>{stats.totalLabs}</div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e5e7eb' }}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Events</div>
              <div className={styles.statValue}>{stats.totalEvents}</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: '0 0 1.5rem 0' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <Link href="/admin/dashboard-content/courses" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white' }}>
              <div style={{ fontSize: '2rem' }}>🎓</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>Manage Courses</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Create and edit courses, modules, and lessons</div>
            </Link>

            <Link href="/admin/dashboard-content/resources" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white' }}>
              <div style={{ fontSize: '2rem' }}>📚</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>Manage Resources</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Upload and organize downloadable resources</div>
            </Link>

            <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white' }}>
              <div style={{ fontSize: '2rem' }}>🔬</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>SUCCESS Labs</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Access interactive tools and AI-powered resources →</div>
            </a>

            <Link href="/admin/dashboard-content/events" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white' }}>
              <div style={{ fontSize: '2rem' }}>📅</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>Manage Events</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Schedule webinars, workshops, and events</div>
            </Link>

            <Link href="/dashboard" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white' }}>
              <div style={{ fontSize: '2rem' }}>👁️</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>Preview Dashboard</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>View the SUCCESS+ member dashboard</div>
            </Link>

            <Link href="/admin/analytics" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white' }}>
              <div style={{ fontSize: '2rem' }}>📊</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>View Analytics</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Track engagement and usage metrics</div>
            </Link>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
