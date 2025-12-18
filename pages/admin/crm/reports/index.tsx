import { useState, useEffect } from 'react';
import { Department } from '@prisma/client';
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
} from 'recharts';
import styles from './Reports.module.css';

interface EmailStats {
  sendsOverTime: Array<{ date: string; sends: number; opens: number; clicks: number }>;
  topCampaigns: Array<{ name: string; sent: number; openRate: number; clickRate: number }>;
  unsubscribeRate: number;
  avgOpenRate: number;
  avgClickRate: number;
}

interface ContactStats {
  contactsOverTime: Array<{ date: string; count: number }>;
  contactsBySource: Array<{ name: string; value: number }>;
  leadScoreDistribution: Array<{ range: string; count: number }>;
  totalContacts: number;
  growthRate: number;
}

interface DealStats {
  pipelineOverTime: Array<{ date: string; value: number }>;
  winLossRate: { won: number; lost: number };
  avgDealSize: number;
  avgSalesCycle: number;
  revenueByOwner: Array<{ owner: string; revenue: number }>;
}

interface TicketStats {
  ticketsOverTime: Array<{ date: string; count: number }>;
  resolutionTimeOverTime: Array<{ date: string; avgHours: number }>;
  ticketsByCategory: Array<{ category: string; count: number }>;
  avgResolutionTime: number;
  totalTickets: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function CRMReports() {
  const [activeTab, setActiveTab] = useState<'email' | 'contacts' | 'deals' | 'tickets'>('email');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [dealStats, setDealStats] = useState<DealStats | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);

  useEffect(() => {
    fetchReports();
  }, [activeTab, dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/reports/${activeTab}?days=${dateRange}`);
      const data = await res.json();

      switch (activeTab) {
        case 'email':
          setEmailStats(data);
          break;
        case 'contacts':
          setContactStats(data);
          break;
        case 'deals':
          setDealStats(data);
          break;
        case 'tickets':
          setTicketStats(data);
          break;
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await fetch(`/api/admin/crm/reports/${activeTab}/export?format=${format}&days=${dateRange}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
    } catch (error) {
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="CRM Reports"
      description="Comprehensive analytics and insights"
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>CRM Reports</h1>
            <p>Analyze performance across email, contacts, deals, and support</p>
          </div>
          <div className={styles.headerActions}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={styles.select}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button onClick={() => handleExport('csv')} className={styles.buttonSecondary}>
              Export CSV
            </button>
            <button onClick={() => handleExport('pdf')} className={styles.buttonSecondary}>
              Export PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['email', 'contacts', 'deals', 'tickets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loading}>Loading reports...</div>
        ) : (
          <>
            {activeTab === 'email' && emailStats && (
              <EmailReports stats={emailStats} />
            )}
            {activeTab === 'contacts' && contactStats && (
              <ContactReports stats={contactStats} />
            )}
            {activeTab === 'deals' && dealStats && (
              <DealReports stats={dealStats} />
            )}
            {activeTab === 'tickets' && ticketStats && (
              <TicketReports stats={ticketStats} />
            )}
          </>
        )}
      </div>
    </DepartmentLayout>
  );
}

function EmailReports({ stats }: { stats: EmailStats }) {
  return (
    <div className={styles.reportsGrid}>
      {/* Sends Over Time */}
      <div className={styles.chartCard}>
        <h3>Email Activity Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.sendsOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sends" stroke="#0088FE" name="Sent" />
            <Line type="monotone" dataKey="opens" stroke="#00C49F" name="Opens" />
            <Line type="monotone" dataKey="clicks" stroke="#FFBB28" name="Clicks" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsCard}>
        <h3>Performance Metrics</h3>
        <div className={styles.metricsList}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Average Open Rate</div>
            <div className={styles.metricValue}>{stats.avgOpenRate.toFixed(1)}%</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Average Click Rate</div>
            <div className={styles.metricValue}>{stats.avgClickRate.toFixed(1)}%</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Unsubscribe Rate</div>
            <div className={styles.metricValue}>{stats.unsubscribeRate.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className={styles.tableCard}>
        <h3>Best Performing Campaigns</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Sent</th>
              <th>Open Rate</th>
              <th>Click Rate</th>
            </tr>
          </thead>
          <tbody>
            {stats.topCampaigns.map((campaign, idx) => (
              <tr key={idx}>
                <td><strong>{campaign.name}</strong></td>
                <td>{campaign.sent.toLocaleString()}</td>
                <td>{campaign.openRate.toFixed(1)}%</td>
                <td>{campaign.clickRate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactReports({ stats }: { stats: ContactStats }) {
  return (
    <div className={styles.reportsGrid}>
      {/* Contacts Over Time */}
      <div className={styles.chartCard}>
        <h3>New Contacts Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.contactsOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsCard}>
        <h3>Contact Metrics</h3>
        <div className={styles.metricsList}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Total Contacts</div>
            <div className={styles.metricValue}>{stats.totalContacts.toLocaleString()}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Growth Rate</div>
            <div className={styles.metricValue}>
              {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Contacts by Source */}
      <div className={styles.chartCard}>
        <h3>Contacts by Source</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={stats.contactsBySource}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {stats.contactsBySource.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Lead Score Distribution */}
      <div className={styles.chartCard}>
        <h3>Lead Score Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.leadScoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DealReports({ stats }: { stats: DealStats }) {
  const winLossData = [
    { name: 'Won', value: stats.winLossRate.won },
    { name: 'Lost', value: stats.winLossRate.lost },
  ];

  return (
    <div className={styles.reportsGrid}>
      {/* Pipeline Value Over Time */}
      <div className={styles.chartCard}>
        <h3>Pipeline Value Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.pipelineOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="value" stroke="#00C49F" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsCard}>
        <h3>Deal Metrics</h3>
        <div className={styles.metricsList}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Average Deal Size</div>
            <div className={styles.metricValue}>${stats.avgDealSize.toLocaleString()}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Avg Sales Cycle</div>
            <div className={styles.metricValue}>{stats.avgSalesCycle} days</div>
          </div>
        </div>
      </div>

      {/* Win/Loss Rate */}
      <div className={styles.chartCard}>
        <h3>Win/Loss Rate</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={winLossData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#00C49F" />
              <Cell fill="#FF8042" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Owner */}
      <div className={styles.chartCard}>
        <h3>Revenue by Owner</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.revenueByOwner}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="owner" />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TicketReports({ stats }: { stats: TicketStats }) {
  return (
    <div className={styles.reportsGrid}>
      {/* Tickets Over Time */}
      <div className={styles.chartCard}>
        <h3>Tickets Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.ticketsOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsCard}>
        <h3>Ticket Metrics</h3>
        <div className={styles.metricsList}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Total Tickets</div>
            <div className={styles.metricValue}>{stats.totalTickets.toLocaleString()}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Avg Resolution Time</div>
            <div className={styles.metricValue}>{stats.avgResolutionTime.toFixed(1)} hours</div>
          </div>
        </div>
      </div>

      {/* Resolution Time Trend */}
      <div className={styles.chartCard}>
        <h3>Resolution Time Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.resolutionTimeOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: any) => `${value} hours`} />
            <Line type="monotone" dataKey="avgHours" stroke="#00C49F" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tickets by Category */}
      <div className={styles.chartCard}>
        <h3>Tickets by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.ticketsByCategory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#FFBB28" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.MARKETING);
