import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './MemberDetail.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type PriorityLevel = 'Standard' | 'High' | 'VIP' | 'Enterprise';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  tags?: string[];
  priorityLevel?: PriorityLevel;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  totalSpent: number;
  lifetimeValue: number;
  subscription?: {
    status: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    stripePriceId?: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    cancelAtPeriodEnd: boolean;
  };
  transactions?: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    description: string;
    provider: string;
    createdAt: string;
  }>;
  orders?: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export default function MemberDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && id) {
      fetchMember();
    }
  }, [session, id]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/members/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);
        setNotesText(data.internalNotes || '');
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!member) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notesText }),
      });

      if (res.ok) {
        showToast('Notes saved successfully', 'success');
        setEditingNotes(false);
        fetchMember();
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to save notes', 'error');
      }
    } catch (error) {
      showToast('Failed to save notes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sendEmail = async () => {
    if (!emailSubject || !emailBody) {
      showToast('Please fill in subject and body', 'error');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/admin/members/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject, body: emailBody }),
      });

      if (response.ok) {
        showToast('Email sent successfully!', 'success');
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
      } else {
        showToast('Failed to send email', 'error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Error sending email', 'error');
    } finally {
      setSending(false);
    }
  };

  const addToCampaign = async (campaignType: string) => {
    try {
      const response = await fetch(`/api/admin/members/${id}/campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignType }),
      });

      if (response.ok) {
        showToast(`Added to ${campaignType} campaign!`, 'success');
        setShowCampaignModal(false);
      } else {
        showToast('Failed to add to campaign', 'error');
      }
    } catch (error) {
      console.error('Error adding to campaign:', error);
      showToast('Error adding to campaign', 'error');
    }
  };

  const sendNewsletter = async () => {
    if (!confirm('Send latest newsletter to this member?')) return;

    try {
      const response = await fetch(`/api/admin/members/${id}/newsletter`, {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Newsletter sent!', 'success');
      } else {
        showToast('Failed to send newsletter', 'error');
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      showToast('Error sending newsletter', 'error');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading member details...</div>
      </AdminLayout>
    );
  }

  if (!session || !member) {
    return (
      <AdminLayout>
        <div className={styles.error}>Member not found</div>
      </AdminLayout>
    );
  }

  const hasActiveSubscription = member.subscription?.status === 'ACTIVE' || member.subscription?.status === 'active';

  return (
    <AdminLayout>
      <div className={styles.memberDetail}>
        <div className={styles.header}>
          <Link href="/admin/members" className={styles.backButton}>
            ← Back to Members
          </Link>
        </div>

        <div className={styles.memberHeader}>
          <div className={styles.memberAvatar}>
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.memberInfo}>
            <h1>{member.name}</h1>
            <p className={styles.email}>{member.email}</p>
            <div className={styles.badges}>
              {hasActiveSubscription ? (
                <span className={styles.badgeActive}>Active Subscriber</span>
              ) : (
                <span className={styles.badgeInactive}>Inactive</span>
              )}
              {member.priorityLevel && member.priorityLevel !== 'Standard' && (
                <span className={styles.badgePriority}>{member.priorityLevel}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {/* Account Information */}
          <div className={styles.card}>
            <h2>Account Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Member ID</span>
                <span className={styles.value}>{member.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{member.email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>{member.firstName} {member.lastName}</span>
              </div>
              {member.phone && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Phone</span>
                  <span className={styles.value}>{member.phone}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.label}>Priority Level</span>
                <span className={styles.value}>{member.priorityLevel || 'Standard'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Total Spent</span>
                <span className={styles.value}>${member.totalSpent?.toFixed(2) || '0.00'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Lifetime Value</span>
                <span className={styles.value}>${member.lifetimeValue?.toFixed(2) || '0.00'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Member Since</span>
                <span className={styles.value}>
                  {new Date(member.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Last Updated</span>
                <span className={styles.value}>
                  {new Date(member.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            {member.tags && member.tags.length > 0 && (
              <div className={styles.tagsSection}>
                <span className={styles.label}>Tags:</span>
                <div className={styles.tags}>
                  {member.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CS Notes */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Internal CS Notes</h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className={styles.editButton}
                >
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className={styles.notesEditor}>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className={styles.notesTextarea}
                  rows={6}
                  placeholder="Add internal notes about this customer (visible only to admins)..."
                />
                <div className={styles.notesActions}>
                  <button
                    onClick={() => {
                      setEditingNotes(false);
                      setNotesText(member.internalNotes || '');
                    }}
                    className={styles.cancelButton}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className={styles.saveButton}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.notesDisplay}>
                {member.internalNotes ? (
                  <p className={styles.notesText}>{member.internalNotes}</p>
                ) : (
                  <p className={styles.notesEmpty}>No internal notes yet. Click "Edit" to add notes.</p>
                )}
              </div>
            )}
          </div>

          {/* Subscription Information */}
          <div className={styles.card}>
            <h2>Subscription Details</h2>
            {member.subscription ? (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Status</span>
                  <span className={styles.value}>
                    {(member.subscription.status === 'ACTIVE' || member.subscription.status === 'active') && (
                      <span className={styles.statusActive}>Active</span>
                    )}
                    {member.subscription.status === 'PAST_DUE' && (
                      <span className={styles.statusPastDue}>Past Due</span>
                    )}
                    {(member.subscription.status === 'CANCELED' || member.subscription.status === 'canceled') && (
                      <span className={styles.statusCanceled}>Canceled</span>
                    )}
                    {member.subscription.status === 'INACTIVE' && (
                      <span className={styles.statusInactive}>Inactive</span>
                    )}
                  </span>
                </div>
                {member.subscription.currentPeriodStart && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Current Period Start</span>
                    <span className={styles.value}>
                      {new Date(member.subscription.currentPeriodStart).toLocaleDateString(
                        'en-US',
                        {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                )}
                {member.subscription.currentPeriodEnd && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Next Billing Date</span>
                    <span className={styles.value}>
                      {new Date(member.subscription.currentPeriodEnd).toLocaleDateString(
                        'en-US',
                        {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                )}
                {member.subscription.cancelAtPeriodEnd && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Cancel at Period End</span>
                    <span className={styles.valueWarning}>
                      Yes - Will cancel on{' '}
                      {member.subscription.currentPeriodEnd
                        ? new Date(member.subscription.currentPeriodEnd).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {member.subscription.stripeSubscriptionId && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Stripe Subscription ID</span>
                    <span className={styles.valueCode}>
                      {member.subscription.stripeSubscriptionId}
                    </span>
                  </div>
                )}
                {member.subscription.stripeCustomerId && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Stripe Customer ID</span>
                    <span className={styles.valueCode}>
                      {member.subscription.stripeCustomerId}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className={styles.noSubscription}>
                No active subscription found
              </p>
            )}

            {member.subscription?.stripeCustomerId && (
              <div className={styles.actions}>
                <a
                  href={`https://dashboard.stripe.com/customers/${member.subscription.stripeCustomerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.stripeButton}
                >
                  View in Stripe Dashboard →
                </a>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          {member.transactions && member.transactions.length > 0 && (
            <div className={styles.card}>
              <h2>Recent Transactions</h2>
              <div className={styles.transactionsList}>
                {member.transactions.map((txn) => (
                  <div key={txn.id} className={styles.transaction}>
                    <div className={styles.transactionInfo}>
                      <div className={styles.transactionAmount}>
                        ${txn.amount.toFixed(2)} {txn.currency}
                      </div>
                      <div className={styles.transactionDesc}>
                        {txn.description || txn.type}
                      </div>
                    </div>
                    <div className={styles.transactionMeta}>
                      <span className={styles.transactionStatus}>
                        {txn.status}
                      </span>
                      <span className={styles.transactionDate}>
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {member.orders && member.orders.length > 0 && (
            <div className={styles.card}>
              <h2>Recent Orders</h2>
              <div className={styles.ordersList}>
                {member.orders.map((order) => (
                  <div key={order.id} className={styles.order}>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderNumber}>
                        Order #{order.orderNumber}
                      </div>
                      <div className={styles.orderAmount}>
                        ${order.total.toFixed(2)}
                      </div>
                    </div>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderStatus}>
                        {order.status}
                      </span>
                      <span className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsSection}>
          <h2>Actions</h2>
          <div className={styles.actionButtons}>
            <Link href={`/admin/members`} className={styles.actionButton}>
              ← Back to List
            </Link>
            <button onClick={() => setShowEmailModal(true)} className={styles.actionButton}>
              📧 Send Email
            </button>
            <button onClick={() => setShowCampaignModal(true)} className={styles.actionButton}>
              🎯 Add to Campaign
            </button>
            <button onClick={sendNewsletter} className={styles.actionButton}>
              📰 Send Newsletter
            </button>
            <Link href={`/admin/subscriptions`} className={styles.actionButton}>
              Manage Subscriptions
            </Link>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className={styles.modal} onClick={() => setShowEmailModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Send Email to {member.name}</h2>
              <button className={styles.closeBtn} onClick={() => setShowEmailModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Subject</label>
                <input
                  type="text"
                  className={styles.input}
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Message</label>
                <textarea
                  className={styles.textarea}
                  rows={10}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Your message..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowEmailModal(false)}>
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={sendEmail}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className={styles.modal} onClick={() => setShowCampaignModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add to Drip Campaign</h2>
              <button className={styles.closeBtn} onClick={() => setShowCampaignModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.campaignList}>
                <div className={styles.campaignCard} onClick={() => addToCampaign('welcome')}>
                  <h4>Welcome Series</h4>
                  <p>5-email onboarding sequence for new members</p>
                </div>
                <div className={styles.campaignCard} onClick={() => addToCampaign('engagement')}>
                  <h4>Engagement Booster</h4>
                  <p>Re-engage inactive members</p>
                </div>
                <div className={styles.campaignCard} onClick={() => addToCampaign('upsell')}>
                  <h4>Premium Upsell</h4>
                  <p>Upgrade members to higher tiers</p>
                </div>
                <div className={styles.campaignCard} onClick={() => addToCampaign('retention')}>
                  <h4>Retention Campaign</h4>
                  <p>Keep members subscribed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
