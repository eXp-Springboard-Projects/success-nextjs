import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Tickets.module.css';

interface Ticket {
  id: string;
  visible_id: number;
  subject: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  contact_email: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export default function TicketsListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter, page]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const res = await fetch(`/api/admin/crm/tickets?${params}`);
      const data = await res.json();

      setTickets(data.tickets || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/crm/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTickets();
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const getContactName = (ticket: Ticket) => {
    if (ticket.contact_first_name || ticket.contact_last_name) {
      return `${ticket.contact_first_name || ''} ${ticket.contact_last_name || ''}`.trim();
    }
    return ticket.contact_email || 'Unknown';
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="Support Tickets"
      description="Manage customer support tickets"
    >
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Support Tickets</h1>
            <p className={styles.pageDescription}>Manage customer support requests</p>
          </div>
          <div className={styles.headerRight}>
            <Link href="/admin/crm/tickets/new" className={styles.primaryButton}>
              + New Ticket
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {tickets.filter(t => t.status === 'open').length}
            </div>
            <div className={styles.statLabel}>Open</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {tickets.filter(t => t.status === 'in_progress').length}
            </div>
            <div className={styles.statLabel}>In Progress</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length}
            </div>
            <div className={styles.statLabel}>High Priority</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {tickets.filter(t => t.status === 'waiting_customer').length}
            </div>
            <div className={styles.statLabel}>Waiting on Customer</div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting on Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All Categories</option>
              <option value="billing">Billing</option>
              <option value="subscription">Subscription</option>
              <option value="access">Access</option>
              <option value="technical">Technical</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎫</div>
              <h3>No tickets found</h3>
              <p>All caught up! No support tickets match your filters.</p>
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Subject</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Category</th>
                    <th>Assignee</th>
                    <th>Messages</th>
                    <th>Last Update</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <Link href={`/admin/crm/tickets/${ticket.id}`} className={styles.ticketNumber}>
                          #{ticket.visible_id}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/admin/crm/tickets/${ticket.id}`} className={styles.ticketSubject}>
                          {ticket.subject}
                        </Link>
                      </td>
                      <td>{getContactName(ticket)}</td>
                      <td>
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                          className={`${styles.statusSelect} ${styles[`status${ticket.status}`]}`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="waiting_customer">Waiting on Customer</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td>
                        <span className={`${styles.priorityBadge} ${styles[`priority${ticket.priority}`]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>{ticket.category}</span>
                      </td>
                      <td>{ticket.assigned_to || 'Unassigned'}</td>
                      <td className={styles.centered}>{ticket.message_count}</td>
                      <td>{new Date(ticket.updated_at).toLocaleString()}</td>
                      <td>
                        <Link href={`/admin/crm/tickets/${ticket.id}`} className={styles.actionButton}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={styles.paginationButton}
                  >
                    Previous
                  </button>
                  <span className={styles.paginationInfo}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={styles.paginationButton}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
