import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from '../CRM.module.css';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'scheduled'>('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/crm/campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"? This action cannot be undone.`)) return;

    try {
      await fetch(`/api/admin/crm/campaigns/${id}`, {
        method: 'DELETE',
      });
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (error) {
      alert('Failed to delete campaign');
    }
  };

  const getStatusBadge = (campaign: Campaign) => {
    if (campaign.status === 'SENT') {
      return <span className={styles.badgeSuccess}>Sent</span>;
    }
    if (campaign.status === 'SCHEDULED') {
      return <span className={styles.badgeInfo}>Scheduled</span>;
    }
    if (campaign.status === 'SENDING') {
      return <span className={styles.badgeWarning}>Sending</span>;
    }
    return <span className={styles.badgeDraft}>Draft</span>;
  };

  const getOpenRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return '0.0';
    return ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1);
  };

  const getClickRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return '0.0';
    return ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1);
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'draft') return c.status === 'DRAFT';
    if (filter === 'sent') return c.status === 'SENT';
    if (filter === 'scheduled') return c.status === 'SCHEDULED';
    return true;
  });

  if (loading) {
    return (
      <DepartmentLayout
        currentDepartment={Department.MARKETING}
        pageTitle="Campaigns"
      >
        <div className={styles.loading}>Loading campaigns...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="Email Campaigns"
      description="View and manage all email campaigns"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Email Campaigns</h1>
            <p>View campaign performance and manage email sends</p>
          </div>
          <Link href="/admin/crm/campaigns/new" className={styles.primaryButton}>
            + New Campaign
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? styles.filterTabActive : styles.filterTab}
          >
            All ({campaigns.length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={filter === 'draft' ? styles.filterTabActive : styles.filterTab}
          >
            Draft ({campaigns.filter(c => c.status === 'DRAFT').length})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={filter === 'scheduled' ? styles.filterTabActive : styles.filterTab}
          >
            Scheduled ({campaigns.filter(c => c.status === 'SCHEDULED').length})
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={filter === 'sent' ? styles.filterTabActive : styles.filterTab}
          >
            Sent ({campaigns.filter(c => c.status === 'SENT').length})
          </button>
        </div>

        {/* Campaigns Table */}
        {filteredCampaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📧</div>
            <div>
              {filter === 'all'
                ? 'No campaigns yet. Create your first campaign to get started.'
                : `No ${filter} campaigns found.`}
            </div>
            <Link href="/admin/crm/campaigns/new" className={styles.primaryButton}>
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <Link
                        href={`/admin/crm/campaigns/${campaign.id}`}
                        className={styles.campaignLink}
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className={styles.subjectCell}>{campaign.subject}</td>
                    <td>{getStatusBadge(campaign)}</td>
                    <td>{campaign.sentCount.toLocaleString()}</td>
                    <td>{getOpenRate(campaign)}%</td>
                    <td>{getClickRate(campaign)}%</td>
                    <td>
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleDateString()
                        : campaign.scheduledAt
                        ? `Scheduled: ${new Date(campaign.scheduledAt).toLocaleDateString()}`
                        : new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <Link
                          href={`/admin/crm/campaigns/${campaign.id}`}
                          className={styles.actionButton}
                        >
                          View
                        </Link>
                        {campaign.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDelete(campaign.id, campaign.name)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.MARKETING);
