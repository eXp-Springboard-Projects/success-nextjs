import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Courses.module.css';

export default function AdminCourses() {
  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Manage Courses"
      description="Create and edit courses, modules, and lessons"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/admin/dashboard-content" className={styles.backLink}>
            ← Back to Dashboard Content
          </Link>
          <button className={styles.addButton}>
            + Add New Course
          </button>
        </div>

        <div className={styles.warningBox}>
          <h3 className={styles.warningTitle}>🚧 Course Management</h3>
          <p className={styles.warningText}>
            Course management interface is under development. You can add courses
            manually to the database using the Prisma schema.
          </p>
          <p className={styles.warningText}>
            <strong>Database Models:</strong> courses, course_modules, course_lessons, course_enrollments
          </p>
          <Link href="/dashboard/courses" className={styles.previewLink}>
            Preview Courses Page →
          </Link>
        </div>

        <div className={styles.infoBox}>
          <h4 className={styles.infoTitle}>To add a course manually:</h4>
          <ol className={styles.infoList}>
            <li>Use Prisma Studio or database client to insert into the <code className={styles.codeTag}>courses</code> table</li>
            <li>Add course modules to the <code className={styles.codeTag}>course_modules</code> table</li>
            <li>Add lessons to each module in the <code className={styles.codeTag}>course_lessons</code> table</li>
            <li>Set <code className={styles.codeTag}>isPublished</code> to true when ready</li>
          </ol>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
