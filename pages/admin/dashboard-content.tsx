import { useState } from 'react';
import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';

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
      <div style={{ padding: '2rem' }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Courses</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>{stats.totalCourses}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Resources</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>{stats.totalResources}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔬</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>SUCCESS Labs</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>{stats.totalLabs}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Events</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>{stats.totalEvents}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: '0 0 1.5rem 0' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <Link href="/admin/dashboard-content/courses" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem' }}>🎓</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>Manage Courses</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Create and edit courses, modules, and lessons</div>
            </Link>

            <Link href="/admin/dashboard-content/resources" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem' }}>📚</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>Manage Resources</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Upload and organize downloadable resources</div>
            </Link>

            <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem' }}>🔬</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>SUCCESS Labs</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Access interactive tools and AI-powered resources →</div>
            </a>

            <Link href="/admin/dashboard-content/events" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem' }}>📅</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>Manage Events</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Schedule webinars, workshops, and events</div>
            </Link>

            <Link href="/dashboard" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem' }}>👁️</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>Preview Dashboard</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>View the SUCCESS+ member dashboard</div>
            </Link>

            <Link href="/admin/analytics" style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white', transition: 'all 0.2s', cursor: 'pointer' }}>
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

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
