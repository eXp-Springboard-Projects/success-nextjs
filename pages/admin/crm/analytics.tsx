import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './contacts/Contacts.module.css';

interface EmailMetrics {
  totalCampaigns: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  totalDelivered: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgDeliveryRate: number;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  failed_count: number;
  delivered_count: number;
  created_at: string;
  sent_at: string | null;
}

export default function CRMAnalyticsPage() {
  const [metrics, setMetrics] = useState<EmailMetrics>({
    totalCampaigns: 0,
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    totalFailed: 0,
    totalDelivered: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    avgDeliveryRate: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all campaigns
      const res = await fetch('/api/admin/crm/campaigns');
      const data = await res.json();
      const allCampaigns = data.campaigns || [];

      // Filter by time range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

      const filteredCampaigns = allCampaigns.filter((c: Campaign) => {
        const createdDate = new Date(c.created_at);
        return createdDate >= cutoffDate;
      });

      setCampaigns(filteredCampaigns);

      // Calculate metrics
      const totalSent = filteredCampaigns.reduce((sum: number, c: Campaign) => sum + (c.sent_count || 0), 0);
      const totalOpened = filteredCampaigns.reduce((sum: number, c: Campaign) => sum + (c.opened_count || 0), 0);
      const totalClicked = filteredCampaigns.reduce((sum: number, c: Campaign) => sum + (c.clicked_count || 0), 0);
      const totalBounced = filteredCampaigns.reduce((sum: number, c: Campaign) => sum + (c.bounced_count || 0), 0);
      const totalFailed = filteredCampaigns.reduce((sum: number, c: Campaign) => sum + (c.failed_count || 0), 0);
      const totalDelivered = filteredCampaigns.reduce((sum: number, c: Campaign) => sum + (c.delivered_count || 0), 0);

      setMetrics({
        totalCampaigns: filteredCampaigns.length,
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        totalFailed,
        totalDelivered,
        avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        avgClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        avgDeliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (num: number) => {
    return num.toFixed(1) + '%';
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="CRM Analytics"
      description="Email campaign performance metrics"
    >
      <div className={styles.dashboard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>CRM Analytics</h1>
            <p className={styles.pageDescription}>Track all email campaign performance</p>
          </div>
          <div className={styles.headerRight}>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="9999">All time</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading analytics...</div>
        ) : (
          <>
            {/* Metrics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <MetricCard
                title="Total Campaigns"
                value={metrics.totalCampaigns.toLocaleString()}
                icon="📧"
                color="#007bff"
              />
              <MetricCard
                title="Emails Sent"
                value={metrics.totalSent.toLocaleString()}
                icon="📤"
                color="#28a745"
              />
              <MetricCard
                title="Avg Open Rate"
                value={formatPercent(metrics.avgOpenRate)}
                icon="👁️"
                color="#17a2b8"
              />
              <MetricCard
                title="Avg Click Rate"
                value={formatPercent(metrics.avgClickRate)}
                icon="🖱️"
                color="#ffc107"
              />
              <MetricCard
                title="Avg Delivery Rate"
                value={formatPercent(metrics.avgDeliveryRate)}
                icon="✅"
                color="#6f42c1"
              />
            </div>

            {/* Detailed Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <SmallMetricCard title="Opened" value={metrics.totalOpened.toLocaleString()} color="#17a2b8" />
              <SmallMetricCard title="Clicked" value={metrics.totalClicked.toLocaleString()} color="#ffc107" />
              <SmallMetricCard title="Delivered" value={metrics.totalDelivered.toLocaleString()} color="#28a745" />
              <SmallMetricCard title="Bounced" value={metrics.totalBounced.toLocaleString()} color="#fd7e14" />
              <SmallMetricCard title="Failed" value={metrics.totalFailed.toLocaleString()} color="#dc3545" />
            </div>

            {/* Campaign List */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Recent Campaigns</h2>

              {campaigns.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                  No campaigns found in this time range
                </p>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Status</th>
                        <th>Sent</th>
                        <th>Opened</th>
                        <th>Clicked</th>
                        <th>Delivered</th>
                        <th>Open Rate</th>
                        <th>Click Rate</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => {
                        const openRate = campaign.sent_count > 0
                          ? (campaign.opened_count / campaign.sent_count) * 100
                          : 0;
                        const clickRate = campaign.sent_count > 0
                          ? (campaign.clicked_count / campaign.sent_count) * 100
                          : 0;

                        return (
                          <tr key={campaign.id}>
                            <td>
                              <a href={`/admin/crm/campaigns/${campaign.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                                {campaign.name}
                              </a>
                              <div style={{ fontSize: '0.875rem', color: '#666' }}>{campaign.subject}</div>
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[`status${campaign.status}`]}`}>
                                {campaign.status}
                              </span>
                            </td>
                            <td>{campaign.sent_count.toLocaleString()}</td>
                            <td>{campaign.opened_count.toLocaleString()}</td>
                            <td>{campaign.clicked_count.toLocaleString()}</td>
                            <td>{campaign.delivered_count.toLocaleString()}</td>
                            <td>{formatPercent(openRate)}</td>
                            <td>{formatPercent(clickRate)}</td>
                            <td>{campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DepartmentLayout>
  );
}

function MetricCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#333' }}>{value}</div>
    </div>
  );
}

function SmallMetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '6px',
      padding: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.MARKETING);
