import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../../components/admin/AdminLayout';
import styles from '../../CRM.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  failedCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  email_templates?: {
    id: string;
    name: string;
    html: string;
  };
  campaign_contacts?: Array<{
    contacts: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
};

type EmailEvent = {
  id: string;
  event: string;
  emailAddress: string;
  createdAt: string;
  contacts: {
    firstName?: string;
    lastName?: string;
  };
};

export default function CampaignDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{sent: number; total: number} | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && id) {
      fetchCampaign();
      fetchEvents();
    }
  }, [session, id]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/crm/campaigns/${id}?include=template,contacts`);
      const data = await res.json();
      setCampaign(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/crm/campaigns/${id}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
    }
  };

  const handleSendCampaign = async () => {
    if (!campaign) return;

    const totalContacts = campaign.campaign_contacts?.length || 0;
    if (totalContacts === 0) {
      alert('No contacts in this campaign');
      return;
    }

    if (!confirm(`Are you sure you want to send this campaign to ${totalContacts} contacts?`)) {
      return;
    }

    setSending(true);
    setSendProgress({ sent: 0, total: totalContacts });

    try {
      const res = await fetch(`/api/admin/crm/campaigns/${id}/send`, {
        method: 'POST',
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Campaign sent successfully!\n\nSent: ${result.sentCount}\nFailed: ${result.failedCount}`);
        fetchCampaign();
        fetchEvents();
      } else {
        const error = await res.json();
        alert(`Failed to send campaign: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSending(false);
      setSendProgress(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading campaign...</div>
      </AdminLayout>
    );
  }

  if (!campaign) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <p>Campaign not found</p>
        </div>
      </AdminLayout>
    );
  }

  const openRate = campaign.sentCount > 0
    ? Math.round((campaign.openedCount / campaign.sentCount) * 100)
    : 0;

  const clickRate = campaign.sentCount > 0
    ? Math.round((campaign.clickedCount / campaign.sentCount) * 100)
    : 0;

  const deliveryRate = campaign.sentCount > 0
    ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>{campaign.name}</h1>
            <p className={styles.subtitle}>{campaign.subject}</p>
          </div>
          <div>
            {campaign.status !== 'SENT' && (
              <button
                onClick={handleSendCampaign}
                disabled={sending}
                className={styles.sendButton}
                style={{
                  background: sending ? '#ccc' : '#10b981',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  marginLeft: '12px',
                }}
              >
                {sending ? '📤 Sending...' : '📤 Send Now'}
              </button>
            )}
            <button
              onClick={() => router.push('/admin/crm/campaigns')}
              className={styles.backButton}
              style={{
                marginLeft: '12px',
                padding: '12px 24px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Send Progress */}
        {sendProgress && (
          <div style={{
            background: '#fef3c7',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <strong>Sending in progress...</strong>
            <div style={{
              background: '#f3f4f6',
              height: '32px',
              borderRadius: '8px',
              overflow: 'hidden',
              marginTop: '12px',
            }}>
              <div style={{
                background: '#10b981',
                height: '100%',
                width: `${(sendProgress.sent / sendProgress.total) * 100}%`,
                transition: 'width 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}>
                {sendProgress.sent} / {sendProgress.total}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className={styles.statsGrid} style={{ marginBottom: '32px' }}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{campaign.sentCount}</div>
            <div className={styles.statLabel}>Sent</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{deliveryRate}%</div>
            <div className={styles.statLabel}>Delivered ({campaign.deliveredCount})</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{openRate}%</div>
            <div className={styles.statLabel}>Opened ({campaign.openedCount})</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{clickRate}%</div>
            <div className={styles.statLabel}>Clicked ({campaign.clickedCount})</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{campaign.bouncedCount}</div>
            <div className={styles.statLabel}>Bounced</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{campaign.failedCount}</div>
            <div className={styles.statLabel}>Failed</div>
          </div>
        </div>

        {/* Campaign Info */}
        <div className={styles.section} style={{ marginBottom: '32px' }}>
          <h2>Campaign Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <strong>Status:</strong> {campaign.status}
            </div>
            <div>
              <strong>Template:</strong> {campaign.email_templates?.name || 'None'}
            </div>
            <div>
              <strong>Contacts:</strong> {campaign.campaign_contacts?.length || 0}
            </div>
            <div>
              <strong>Created:</strong> {new Date(campaign.createdAt).toLocaleString()}
            </div>
            {campaign.scheduledAt && (
              <div>
                <strong>Scheduled:</strong> {new Date(campaign.scheduledAt).toLocaleString()}
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <strong>Sent:</strong> {new Date(campaign.sentAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Email Events Timeline */}
        <div className={styles.section}>
          <h2>Email Events Timeline</h2>
          {events.length === 0 ? (
            <p style={{ color: '#6b7280', marginTop: '16px' }}>No events yet</p>
          ) : (
            <div style={{ marginTop: '16px' }}>
              {events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: '12px',
                    borderLeft: '4px solid #10b981',
                    marginBottom: '12px',
                    background: '#f9fafb',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{event.event.toUpperCase()}</strong> -{' '}
                      {event.contacts.firstName || ''} {event.contacts.lastName || ''} ({event.emailAddress})
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
