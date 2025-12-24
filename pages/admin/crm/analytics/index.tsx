import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import styles from '../../editorial/Editorial.module.css';

interface AnalyticsData {
  email: {
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    timeseries: Array<{ date: string; sends: number; opens: number; clicks: number }>;
    topCampaigns: Array<{ id: string; name: string; sent: number; opens: number; clicks: number; openRate: number }>;
  };
  contacts: {
    timeseries: Array<{ date: string; count: number }>;
    bySource: Array<{ source: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  deals: {
    totalValue: number;
    winRate: number;
    avgDealSize: number;
    dealsByStage: Array<{ stage: string; count: number; value: number }>;
    dealsTimeseries: Array<{ date: string; count: number; value: number }>;
  };
  tickets: {
    totalTickets: number;
    avgResolutionTime: number;
    ticketsByCategory: Array<{ category: string; count: number }>;
    ticketsByPriority: Array<{ priority: string; count: number }>;
    ticketsTimeseries: Array<{ date: string; count: number }>;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CRMAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const res = await fetch(
        `/api/admin/crm/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;

    const csv = [
      'CRM Analytics Report',
      '',
      'Email Analytics',
      `Total Sent,${data.email.totalSent}`,
      `Open Rate,${data.email.openRate}%`,
      `Click Rate,${data.email.clickRate}%`,
      `Bounce Rate,${data.email.bounceRate}%`,
      `Unsubscribe Rate,${data.email.unsubscribeRate}%`,
      '',
      'Top Campaigns',
      'Name,Sent,Opens,Clicks,Open Rate',
      ...data.email.topCampaigns.map(
        (c) => `${c.name},${c.sent},${c.opens},${c.clicks},${c.openRate}%`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <DepartmentLayout
        currentDepartment={Department.SUPER_ADMIN}
        pageTitle="CRM Analytics"
        description="Analytics and insights for your CRM"
      >
        <div className={styles.emptyState}>Loading analytics...</div>
      </DepartmentLayout>
    );
  }

  if (!data) {
    return (
      <DepartmentLayout
        currentDepartment={Department.SUPER_ADMIN}
        pageTitle="CRM Analytics"
        description="Analytics and insights for your CRM"
      >
        <div className={styles.emptyState}>Failed to load analytics</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout
      currentDepartment={Department.SUPER_ADMIN}
      pageTitle="CRM Analytics"
      description="Analytics and insights for your CRM"
    >
      <div className={styles.dashboard}>
        {/* Date Range Picker */}
        <div className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setDateRange('7')}
                style={{
                  padding: '0.5rem 1rem',
                  background: dateRange === '7' ? '#3b82f6' : 'white',
                  color: dateRange === '7' ? 'white' : '#374151',
                  border: `1px solid ${dateRange === '7' ? '#3b82f6' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setDateRange('30')}
                style={{
                  padding: '0.5rem 1rem',
                  background: dateRange === '30' ? '#3b82f6' : 'white',
                  color: dateRange === '30' ? 'white' : '#374151',
                  border: `1px solid ${dateRange === '30' ? '#3b82f6' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Last 30 days
              </button>
              <button
                onClick={() => setDateRange('90')}
                style={{
                  padding: '0.5rem 1rem',
                  background: dateRange === '90' ? '#3b82f6' : 'white',
                  color: dateRange === '90' ? 'white' : '#374151',
                  border: `1px solid ${dateRange === '90' ? '#3b82f6' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Last 90 days
              </button>
            </div>
            <button
              onClick={handleExport}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Email Analytics */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📧 Email Analytics</h2>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📬</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Total Sent</div>
                <div className={styles.statValue}>{data.email.totalSent.toLocaleString()}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📖</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Open Rate</div>
                <div className={styles.statValue}>{data.email.openRate}%</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🖱️</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Click Rate</div>
                <div className={styles.statValue}>{data.email.clickRate}%</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>⚠️</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Bounce Rate</div>
                <div className={styles.statValue}>{data.email.bounceRate}%</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🚫</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Unsubscribe Rate</div>
                <div className={styles.statValue}>{data.email.unsubscribeRate}%</div>
              </div>
            </div>
          </div>

          {data.email.timeseries.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Email Activity Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.email.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sends" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.email.topCampaigns.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Top Performing Campaigns
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                      Campaign
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                      Sent
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                      Opens
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                      Clicks
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
                      Open Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.email.topCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                        {campaign.name}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                        {campaign.sent.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                        {campaign.opens.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                        {campaign.clicks.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                        {campaign.openRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contact Analytics */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>👥 Contact Analytics</h2>

          <div className={styles.twoColumn}>
            <div>
              {data.contacts.timeseries.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    New Contacts Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.contacts.timeseries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            <div>
              {data.contacts.bySource.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Contacts by Source
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data.contacts.bySource}
                        dataKey="count"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {data.contacts.bySource.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </div>

          {data.contacts.byStatus.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Contacts by Status
              </h3>
              <div className={styles.miniStatsGrid}>
                {data.contacts.byStatus.map((status) => (
                  <div key={status.status} className={styles.miniStat}>
                    <div className={styles.miniStatValue}>{status.count.toLocaleString()}</div>
                    <div className={styles.miniStatLabel}>{status.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Deal Analytics */}
        {data.deals.dealsByStage.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>💰 Deal Analytics</h2>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💵</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Pipeline Value</div>
                  <div className={styles.statValue}>
                    ${data.deals.totalValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🎯</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Win Rate</div>
                  <div className={styles.statValue}>{data.deals.winRate.toFixed(1)}%</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Avg Deal Size</div>
                  <div className={styles.statValue}>
                    ${data.deals.avgDealSize.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Deals by Stage (Funnel)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.deals.dealsByStage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6">
                    <LabelList dataKey="count" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Ticket Analytics */}
        {data.tickets.totalTickets > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🎫 Ticket Analytics</h2>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📋</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Total Tickets</div>
                  <div className={styles.statValue}>{data.tickets.totalTickets.toLocaleString()}</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Avg Resolution Time</div>
                  <div className={styles.statValue}>
                    {data.tickets.avgResolutionTime.toFixed(1)}h
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.twoColumn} style={{ marginTop: '2rem' }}>
              {data.tickets.ticketsByCategory.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Tickets by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.tickets.ticketsByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.tickets.ticketsByPriority.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Tickets by Priority
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data.tickets.ticketsByPriority}
                        dataKey="count"
                        nameKey="priority"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {data.tickets.ticketsByPriority.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {data.tickets.ticketsTimeseries.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Tickets Over Time
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.tickets.ticketsTimeseries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUPER_ADMIN);
