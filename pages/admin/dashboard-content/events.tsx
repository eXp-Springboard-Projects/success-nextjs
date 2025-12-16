import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Events.module.css';

export default function AdminEvents() {
  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Manage Events"
      description="Schedule webinars, workshops, and events"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/admin/dashboard-content" className={styles.backLink}>
            ← Back to Dashboard Content
          </Link>
          <button className={styles.addButton}>
            + Add New Event
          </button>
        </div>

        <div className={styles.warningBox}>
          <h3 className={styles.warningTitle}>🚧 Event Management</h3>
          <p className={styles.warningText}>
            Event management interface is under development. You can add events
            manually to the database using the Prisma schema.
          </p>
          <p className={styles.warningText}>
            <strong>Database Models:</strong> events, event_registrations
          </p>
          <p className={styles.warningText}>
            <strong>Event Types:</strong> WEBINAR, WORKSHOP, QA_SESSION, NETWORKING, MASTERCLASS, CONFERENCE
          </p>
          <Link href="/dashboard/events" className={styles.previewLink}>
            Preview Events Page →
          </Link>
        </div>

        <div className={styles.infoBox}>
          <h4 className={styles.infoTitle}>To add an event manually:</h4>
          <ol className={styles.infoList}>
            <li>Use Prisma Studio or database client to insert into the <code className={styles.codeTag}>events</code> table</li>
            <li>Include: title, slug, description, eventType, startDateTime, endDateTime</li>
            <li>Add timezone (default: "America/New_York")</li>
            <li>Add location URL for virtual events or physical address</li>
            <li>Set <code className={styles.codeTag}>maxAttendees</code> for capacity limits (optional)</li>
            <li>Set <code className={styles.codeTag}>isPublished</code> to true when ready</li>
            <li>Set <code className={styles.codeTag}>isPremium</code> to true for SUCCESS+ exclusive events</li>
          </ol>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
