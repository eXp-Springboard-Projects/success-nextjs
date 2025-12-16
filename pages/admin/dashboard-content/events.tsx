import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';

export default function AdminEvents() {
  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Manage Events"
      description="Schedule webinars, workshops, and events"
    >
      <div style={{ padding: '2rem' }}>
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
            + Add New Event
          </button>
        </div>

        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#92400e' }}>🚧 Event Management</h3>
          <p style={{ margin: '0 0 0.75rem 0', color: '#78350f' }}>
            Event management interface is under development. You can add events
            manually to the database using the Prisma schema.
          </p>
          <p style={{ margin: '0 0 0.75rem 0', color: '#78350f' }}>
            <strong>Database Models:</strong> events, event_registrations
          </p>
          <p style={{ margin: '0 0 1rem 0', color: '#78350f' }}>
            <strong>Event Types:</strong> WEBINAR, WORKSHOP, QA_SESSION, NETWORKING, MASTERCLASS, CONFERENCE
          </p>
          <Link href="/dashboard/events" style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            Preview Events Page →
          </Link>
        </div>

        <div style={{
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '1.5rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#111827' }}>To add an event manually:</h4>
          <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
            <li style={{ marginBottom: '0.5rem' }}>Use Prisma Studio or database client to insert into the <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>events</code> table</li>
            <li style={{ marginBottom: '0.5rem' }}>Include: title, slug, description, eventType, startDateTime, endDateTime</li>
            <li style={{ marginBottom: '0.5rem' }}>Add timezone (default: "America/New_York")</li>
            <li style={{ marginBottom: '0.5rem' }}>Add location URL for virtual events or physical address</li>
            <li style={{ marginBottom: '0.5rem' }}>Set <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>maxAttendees</code> for capacity limits (optional)</li>
            <li style={{ marginBottom: '0.5rem' }}>Set <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>isPublished</code> to true when ready</li>
            <li>Set <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>isPremium</code> to true for SUCCESS+ exclusive events</li>
          </ol>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
