import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Resources.module.css';

export default function AdminResources() {
  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Manage Resources"
      description="Upload and organize downloadable resources"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/admin/dashboard-content" className={styles.backLink}>
            ← Back to Dashboard Content
          </Link>
          <button className={styles.addButton}>
            + Add New Resource
          </button>
        </div>

        <div className={styles.warningBox}>
          <h3 className={styles.warningTitle}>🚧 Resource Management</h3>
          <p className={styles.warningText}>
            Resource management interface is under development. You can add resources
            manually to the database using the Prisma schema.
          </p>
          <p className={styles.warningText}>
            <strong>Database Model:</strong> resources
          </p>
          <p className={styles.warningText}>
            <strong>Categories:</strong> TEMPLATES, GUIDES, WORKSHEETS, EBOOKS, TOOLS, CHECKLISTS
          </p>
          <Link href="/dashboard/resources" className={styles.previewLink}>
            Preview Resources Page →
          </Link>
        </div>

        <div className={styles.infoBox}>
          <h4 className={styles.infoTitle}>To add a resource manually:</h4>
          <ol className={styles.infoList}>
            <li>Upload the file to your storage (e.g., AWS S3, Cloudinary)</li>
            <li>Use Prisma Studio or database client to insert into the <code className={styles.codeTag}>resources</code> table</li>
            <li>Include: title, description, category, fileUrl, fileType, fileSize</li>
            <li>Set <code className={styles.codeTag}>isPremium</code> to true for SUCCESS+ exclusive content</li>
          </ol>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
