import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './CRM.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  _count?: {
    contacts: number;
    emails: number;
  };
};

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    scheduledAt: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCampaigns();
    }
  }, [session]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/crm/campaigns');
      const data = await res.json();
      setCampaigns(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject) {
      alert('Name and subject are required');
      return;
    }

    try {
      const res = await fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewCampaign({ name: '', subject: '', scheduledAt: '' });
        fetchCampaigns();
      }
    } catch (error) {
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await fetch(`/api/crm/campaigns/${id}`, {
        method: 'DELETE',
      });
      fetchCampaigns();
    } catch (error) {
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      DRAFT: styles.statusDRAFT,
      SCHEDULED: styles.statusSCHEDULED,
      SENDING: styles.statusSENDING,
      SENT: styles.statusSENT,
      PAUSED: styles.statusPAUSED
    };

    return (
      <span className={`${styles.status} ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading campaigns...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Email Campaigns</h1>
          <button onClick={() => setShowCreateModal(true)} className={styles.addButton}>
            ➕ Create Campaign
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{campaigns.length}</div>
            <div className={styles.statLabel}>Total Campaigns</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {campaigns.filter(c => c.status === 'SENT').length}
            </div>
            <div className={styles.statLabel}>Sent</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {campaigns.filter(c => c.status === 'SCHEDULED').length}
            </div>
            <div className={styles.statLabel}>Scheduled</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {campaigns.reduce((sum, c) => sum + c.totalSent, 0)}
            </div>
            <div className={styles.statLabel}>Total Emails Sent</div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className={styles.campaignsGrid}>
          {campaigns.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No campaigns yet. Create your first drip campaign!</p>
            </div>
          ) : (
            campaigns.map(campaign => (
              <div key={campaign.id} className={styles.campaignCard}>
                <div className={styles.campaignHeader}>
                  <h3>{campaign.name}</h3>
                  {getStatusBadge(campaign.status)}
                </div>

                <div className={styles.campaignSubject}>
                  <strong>Subject:</strong> {campaign.subject}
                </div>

                <div className={styles.campaignStats}>
                  <div className={styles.campaignStat}>
                    <span className={styles.campaignStatValue}>{campaign._count?.contacts || 0}</span>
                    <span className={styles.campaignStatLabel}>Contacts</span>
                  </div>
                  <div className={styles.campaignStat}>
                    <span className={styles.campaignStatValue}>{campaign._count?.emails || 0}</span>
                    <span className={styles.campaignStatLabel}>Emails in Sequence</span>
                  </div>
                  <div className={styles.campaignStat}>
                    <span className={styles.campaignStatValue}>{campaign.totalSent}</span>
                    <span className={styles.campaignStatLabel}>Sent</span>
                  </div>
                  <div className={styles.campaignStat}>
                    <span className={styles.campaignStatValue}>
                      {campaign.totalSent > 0
                        ? Math.round((campaign.totalOpened / campaign.totalSent) * 100)
                        : 0}%
                    </span>
                    <span className={styles.campaignStatLabel}>Open Rate</span>
                  </div>
                </div>

                {campaign.scheduledAt && (
                  <div className={styles.campaignSchedule}>
                    📅 Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                  </div>
                )}

                {campaign.sentAt && (
                  <div className={styles.campaignSchedule}>
                    ✅ Sent: {new Date(campaign.sentAt).toLocaleString()}
                  </div>
                )}

                <div className={styles.campaignActions}>
                  <button
                    onClick={() => router.push(`/admin/crm/campaigns/${campaign.id}`)}
                    className={styles.viewButton}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className={styles.deleteButton}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Create New Campaign</h2>
                <button onClick={() => setShowCreateModal(false)} className={styles.closeButton}>
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Campaign Name *</label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    className={styles.input}
                    placeholder="Welcome Series"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email Subject *</label>
                  <input
                    type="text"
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                    className={styles.input}
                    placeholder="Welcome to SUCCESS Magazine!"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newCampaign.scheduledAt}
                    onChange={(e) => setNewCampaign({...newCampaign, scheduledAt: e.target.value})}
                    className={styles.input}
                  />
                </div>

                <div className={styles.infoBox}>
                  ℹ️ After creating the campaign, you can add drip emails, select contacts, and configure the sequence.
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button onClick={() => setShowCreateModal(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleCreateCampaign} className={styles.saveButton}>
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
