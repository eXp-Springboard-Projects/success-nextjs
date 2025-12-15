import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from '../DashboardContent.module.css';

export default function AdminCourses() {
  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Manage Courses"
      description="Create and edit courses, modules, and lessons"
    >
      <div className={styles.dashboard}>
        <div className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Link href="/admin/dashboard-content" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}>
              ← Back to Dashboard Content
            </Link>
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              + Add New Course
            </button>
          </div>

          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#92400e' }}>🚧 Course Management</h3>
            <p style={{ margin: '0 0 0.75rem 0', color: '#78350f' }}>
              Course management interface is under development. You can add courses
              manually to the database using the Prisma schema.
            </p>
            <p style={{ margin: '0 0 1rem 0', color: '#78350f' }}>
              <strong>Database Models:</strong> courses, course_modules, course_lessons, course_enrollments
            </p>
            <Link href="/dashboard/courses" style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Preview Courses Page →
            </Link>
          </div>

          <div style={{
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#111827' }}>To add a course manually:</h4>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
              <li style={{ marginBottom: '0.5rem' }}>Use Prisma Studio or database client to insert into the <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>courses</code> table</li>
              <li style={{ marginBottom: '0.5rem' }}>Add course modules to the <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>course_modules</code> table</li>
              <li style={{ marginBottom: '0.5rem' }}>Add lessons to each module in the <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>course_lessons</code> table</li>
              <li>Set <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>isPublished</code> to true when ready</li>
            </ol>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
