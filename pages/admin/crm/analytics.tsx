import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';

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
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/campaigns');
      if (!res.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const data = await res.json();
      const allCampaigns = data.campaigns || [];

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

      const filteredCampaigns = allCampaigns.filter((c: Campaign) => {
        const createdDate = new Date(c.created_at);
        return createdDate >= cutoffDate;
      });

      setCampaigns(filteredCampaigns);

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
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="CRM Analytics"
      description="Email campaign performance metrics"
    >
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>CRM Analytics</h1>
            <p style={{ color: '#666' }}>Track all email campaign performance</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="9999">All time</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading analytics...</div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <MetricCard title="Total Campaigns" value={metrics.totalCampaigns.toLocaleString()} icon="📧" color="#007bff" />
              <MetricCard title="Emails Sent" value={metrics.totalSent.toLocaleString()} icon="📤" color="#28a745" />
              <MetricCard title="Avg Open Rate" value={(metrics.avgOpenRate.toFixed(1)) + '%'} icon="👁️" color="#17a2b8" />
              <MetricCard title="Avg Click Rate" value={(metrics.avgClickRate.toFixed(1)) + '%'} icon="🖱️" color="#ffc107" />
              <MetricCard title="Avg Delivery Rate" value={(metrics.avgDeliveryRate.toFixed(1)) + '%'} icon="✅" color="#6f42c1" />
            </div>

            {/* Small Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <SmallMetric title="Opened" value={metrics.totalOpened.toLocaleString()} color="#17a2b8" />
              <SmallMetric title="Clicked" value={metrics.totalClicked.toLocaleString()} color="#ffc107" />
              <SmallMetric title="Delivered" value={metrics.totalDelivered.toLocaleString()} color="#28a745" />
              <SmallMetric title="Bounced" value={metrics.totalBounced.toLocaleString()} color="#fd7e14" />
              <SmallMetric title="Failed" value={metrics.totalFailed.toLocaleString()} color="#dc3545" />
            </div>

            {/* Campaigns Table */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Recent Campaigns</h2>

              {campaigns.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No campaigns found in this time range
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>Campaign</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>Status</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Sent</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Opened</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Clicked</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Open Rate</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Click Rate</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Date</th>
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
                          <tr key={campaign.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <a href={`/admin/crm/campaigns/${campaign.id}`} style={{ color: '#007bff', textDecoration: 'none', fontWeight: 500 }}>
                                {campaign.name}
                              </a>
                              <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>{campaign.subject}</div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: campaign.status === 'SENT' ? '#d4edda' : '#f8d7da',
                                color: campaign.status === 'SENT' ? '#155724' : '#721c24',
                              }}>
                                {campaign.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{campaign.sent_count.toLocaleString()}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{campaign.opened_count.toLocaleString()}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{campaign.clicked_count.toLocaleString()}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{openRate.toFixed(1)}%</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{clickRate.toFixed(1)}%</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : '-'}
                            </td>
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

function SmallMetric({ title, value, color }: { title: string; value: string; color: string }) {
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
