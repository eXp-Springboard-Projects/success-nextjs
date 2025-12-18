import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Tickets.module.css';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  sender_type: 'staff' | 'customer';
  message: string;
  is_internal: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  visible_id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  contact_id: string | null;
  contact_email: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_phone: string | null;
  contact_company: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  messages: Message[];
}

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/tickets/${id}`);
      const data = await res.json();
      setTicket(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/admin/crm/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTicket();
      }
    } catch (error) {
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/admin/crm/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        fetchTicket();
      }
    } catch (error) {
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/admin/crm/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });
      if (res.ok) {
        fetchTicket();
      }
    } catch (error) {
    }
  };

  const handleAssignChange = async (assignedTo: string) => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/admin/crm/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: assignedTo || null }),
      });
      if (res.ok) {
        fetchTicket();
      }
    } catch (error) {
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/crm/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage,
          isInternal,
        }),
      });

      if (res.ok) {
        setReplyMessage('');
        setIsInternal(false);
        fetchTicket();
      }
    } catch (error) {
    } finally {
      setSending(false);
    }
  };

  const getContactName = (ticket: Ticket) => {
    if (ticket.contact_first_name || ticket.contact_last_name) {
      return `${ticket.contact_first_name || ''} ${ticket.contact_last_name || ''}`.trim();
    }
    return ticket.contact_email || 'Unknown';
  };

  const getContactInitials = (ticket: Ticket) => {
    if (ticket.contact_first_name || ticket.contact_last_name) {
      const first = ticket.contact_first_name?.[0] || '';
      const last = ticket.contact_last_name?.[0] || '';
      return (first + last).toUpperCase();
    }
    return ticket.contact_email?.[0]?.toUpperCase() || '?';
  };

  const getSenderInitials = (message: Message) => {
    if (message.sender_type === 'staff') {
      return 'S';
    }
    return 'C';
  };

  if (loading) {
    return (
      <DepartmentLayout
        currentDepartment={Department.CUSTOMER_SERVICE}
        pageTitle="Loading..."
        description="Loading ticket"
      >
        <div className={styles.loading}>Loading ticket...</div>
      </DepartmentLayout>
    );
  }

  if (!ticket) {
    return (
      <DepartmentLayout
        currentDepartment={Department.CUSTOMER_SERVICE}
        pageTitle="Not Found"
        description="Ticket not found"
      >
        <div className={styles.error}>Ticket not found</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle={`Ticket #${ticket.visible_id}`}
      description={ticket.subject}
    >
      <div className={styles.container}>
        <Link href="/admin/crm/tickets" className={styles.backLink}>
          ← Back to Tickets
        </Link>

        {/* Ticket Header */}
        <div className={styles.ticketHeader}>
          <div className={styles.ticketLeft}>
            <div className={styles.ticketNumber}>Ticket #{ticket.visible_id}</div>
            <h1 className={styles.ticketSubject}>{ticket.subject}</h1>

            <div className={styles.ticketMeta}>
              <div className={styles.metaGroup}>
                <label className={styles.metaLabel}>Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`${styles.statusSelect} ${styles[`status${ticket.status}`]}`}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting on Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className={styles.metaGroup}>
                <label className={styles.metaLabel}>Priority</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className={styles.select}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className={styles.metaGroup}>
                <label className={styles.metaLabel}>Category</label>
                <select
                  value={ticket.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={styles.select}
                >
                  <option value="billing">Billing</option>
                  <option value="subscription">Subscription</option>
                  <option value="access">Access</option>
                  <option value="technical">Technical</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className={styles.metaGroup}>
                <label className={styles.metaLabel}>Assigned To</label>
                <select
                  value={ticket.assigned_to || ''}
                  onChange={(e) => handleAssignChange(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Unassigned</option>
                  <option value="Support Team">Support Team</option>
                  <option value="Rachel Nead">Rachel Nead</option>
                  <option value="Technical Team">Technical Team</option>
                  <option value="Billing Team">Billing Team</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Messages Column */}
          <div className={styles.messagesColumn}>
            {/* Message Thread */}
            <div className={styles.messageThread}>
              <h2 className={styles.threadTitle}>Conversation</h2>

              <div className={styles.messages}>
                {ticket.messages.map((message) => (
                  <div key={message.id} className={styles.message}>
                    <div
                      className={`${styles.messageAvatar} ${
                        message.sender_type === 'staff' ? styles.messageAvatarStaff : ''
                      }`}
                    >
                      {getSenderInitials(message)}
                    </div>
                    <div className={styles.messageContent}>
                      {message.is_internal && (
                        <div className={styles.internalBadge}>🔒 Internal Note</div>
                      )}
                      <div className={styles.messageHeader}>
                        <span className={styles.messageSender}>
                          {message.sender_type === 'staff' ? 'Staff' : getContactName(ticket)}
                        </span>
                        <span className={styles.messageDate}>
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`${styles.messageText} ${
                          message.is_internal ? styles.internalNote : ''
                        }`}
                      >
                        {message.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className={styles.replyBox}>
                <h3 className={styles.replyTitle}>Reply</h3>
                <form onSubmit={handleSendReply} className={styles.replyForm}>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className={styles.textarea}
                    required
                  />
                  <div className={styles.replyActions}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className={styles.checkbox}
                      />
                      Internal note (customer won't see this)
                    </label>
                    <button
                      type="submit"
                      disabled={sending || !replyMessage.trim()}
                      className={styles.primaryButton}
                    >
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Activity Log */}
            <div className={styles.activityLog}>
              <h2 className={styles.activityTitle}>Activity Log</h2>
              <div className={styles.timeline}>
                {ticket.messages
                  .filter((m) => m.is_internal)
                  .map((activity) => (
                    <div key={activity.id} className={styles.timelineItem}>
                      <div className={styles.timelineIcon}>📝</div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineDescription}>
                          {activity.message}
                        </div>
                        <div className={styles.timelineDate}>
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                {ticket.messages.filter((m) => m.is_internal).length === 0 && (
                  <div className={styles.empty}>No activity recorded</div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Sidebar */}
          <div className={styles.contactSidebar}>
            <h3 className={styles.sidebarTitle}>Contact Information</h3>

            <div className={styles.contactInfo}>
              <div className={styles.contactAvatar}>{getContactInitials(ticket)}</div>
              <h4 className={styles.contactName}>{getContactName(ticket)}</h4>
              {ticket.contact_email && (
                <div className={styles.contactEmail}>{ticket.contact_email}</div>
              )}

              <div className={styles.contactDetails}>
                {ticket.contact_phone && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Phone</div>
                    <div className={styles.detailValue}>{ticket.contact_phone}</div>
                  </div>
                )}
                {ticket.contact_company && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Company</div>
                    <div className={styles.detailValue}>{ticket.contact_company}</div>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Created</div>
                  <div className={styles.detailValue}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
                {ticket.resolved_at && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Resolved</div>
                    <div className={styles.detailValue}>
                      {new Date(ticket.resolved_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {ticket.contact_id && (
                <Link
                  href={`/admin/crm/contacts/${ticket.contact_id}`}
                  className={styles.viewProfileLink}
                >
                  View Full Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
