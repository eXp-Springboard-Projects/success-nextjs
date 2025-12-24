import { withDepartmentAccess } from '@/lib/auth/withDepartmentAccess';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import styles from './SuperAdmin.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';
import { Department } from '@/lib/types';

function SuperAdminDashboard() {
  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Super Admin Dashboard</h1>
          <p className={styles.subtitle}>Full system access and control</p>
        </div>

        <div className={styles.grid}>
          <Link href="/admin/users" className={styles.card}>
            <h3>User & Role Management</h3>
            <p>Manage staff accounts, assign roles and departments</p>
            <span className={styles.cardButton}>Manage Users</span>
          </Link>

          <Link href="/admin/settings" className={styles.card}>
            <h3>System Configuration</h3>
            <p>Site-wide settings, feature flags, environment management</p>
            <span className={styles.cardButton}>System Settings</span>
          </Link>

          <Link href="/admin/activity-log" className={styles.card}>
            <h3>Audit Logs</h3>
            <p>View login history and all system actions</p>
            <span className={styles.cardButton}>View Logs</span>
          </Link>

          <Link href="/admin/site-monitor" className={styles.card}>
            <h3>Site Monitoring</h3>
            <p>Database health, performance metrics, system status</p>
            <span className={styles.cardButton}>Monitor Site</span>
          </Link>
        </div>

        <div className={styles.departmentAccess}>
          <h2>Access All Departments</h2>
          <div className={styles.deptGrid}>
            <Link href="/admin/customer-service" className={styles.deptCard}>
              Customer Service
            </Link>
            <Link href="/admin/editorial" className={styles.deptCard}>
              Editorial
            </Link>
            <Link href="/admin/success-plus" className={styles.deptCard}>
              SUCCESS+
            </Link>
            <Link href="/admin/dev" className={styles.deptCard}>
              Dev
            </Link>
            <Link href="/admin/marketing" className={styles.deptCard}>
              Marketing
            </Link>
            <Link href="/admin/coaching" className={styles.deptCard}>
              Coaching
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withDepartmentAccess(SuperAdminDashboard, {
  department: Department.SUPER_ADMIN,
});

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
