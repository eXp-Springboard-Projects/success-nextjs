import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import styles from './CRM.module.css';

interface DashboardStats {
  totalContacts: number;
  contactsTrend: number;
  activeDeals: number;
  dealsTotalValue: number;
  openTickets: number;
  avgResolutionTime: number;
  emailsSent: number;
  emailOpenRate: string;
}

interface Activity {
  source: string;
  type: string;
  description: string;
  created_at: string;
  created_by: string;
}

interface Campaign {
  id: string;
  name: string;
  total_sent: number;
  total_opened: number;
  open_rate: number;
  sent_at: string;
}

interface PipelineStage {
  stage_id: string;
  stage_name: string;
  stage_color: string;
  deal_count: number;
  total_value: number;
}

interface TicketPriority {
  priority: string;
  count: number;
}

interface HotLead {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  leadScore: number;
}

export default function CRMDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [tickets, setTickets] = useState<TicketPriority[]>([]);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchHotLeads();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/crm/dashboard-stats');
      const data = await res.json();

      setStats(data.stats);
      setActivities(data.recentActivities || []);
      setCampaigns(data.topCampaigns || []);
      setPipeline(data.pipelineSummary || []);
      setTickets(data.ticketsByPriority || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchHotLeads = async () => {
    try {
      const res = await fetch('/api/admin/crm/lead-scoring/top-leads?limit=10');
      const data = await res.json();
      setHotLeads(data.leads || []);
    } catch (error) {
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = (hours / 24).toFixed(1);
    return `${days}d`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getMaxPipelineValue = () => {
    return Math.max(...pipeline.map(p => p.total_value), 1);
  };

  const getScoreBadge = (score: number) => {
    let color = '#6c757d';
    let label = 'None';

    if (score >= 100) {
      color = '#dc3545';
      label = 'Hot';
    } else if (score >= 50) {
      color = '#fd7e14';
      label = 'Warm';
    } else if (score >= 20) {
      color = '#ffc107';
      label = 'Medium';
    } else if (score > 0) {
      color = '#17a2b8';
      label = 'Cold';
    }

    return (
      <span style={{
        background: color,
        color: '#fff',
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}>
        {score} {label}
      </span>
    );
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="CRM Dashboard">
        <div className={styles.loading}>Loading dashboard...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="CRM Dashboard">
      <div className={styles.dashboard} style={{ padding: '2rem' }}>
        <h1 className={styles.title}>CRM Dashboard</h1>

        {/* Stats Row */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Contacts</div>
            <div className={styles.statValue}>{stats?.totalContacts || 0}</div>
            <div className={styles.statSubtext}>
              <span className={`${styles.statTrend} ${stats && stats.contactsTrend >= 0 ? styles.trendUp : styles.trendDown}`}>
                {stats && stats.contactsTrend >= 0 ? '↑' : '↓'} {Math.abs(stats?.contactsTrend || 0)}
              </span>
              <span>vs last month</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Deals</div>
            <div className={styles.statValue} style={{ fontSize: '1.75rem' }}>
              {formatCurrency(stats?.dealsTotalValue || 0)}
            </div>
            <div className={styles.statSubtext}>
              {stats?.activeDeals || 0} open deals
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Open Tickets</div>
            <div className={styles.statValue}>{stats?.openTickets || 0}</div>
            <div className={styles.statSubtext}>
              Avg {formatTime(stats?.avgResolutionTime || 0)} resolution
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Emails This Month</div>
            <div className={styles.statValue}>{stats?.emailsSent || 0}</div>
            <div className={styles.statSubtext}>
              {stats?.emailOpenRate || '0'}% open rate
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <a href="/admin/crm/contacts/new" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ color: '#3b82f6' }}>👤</div>
              <div className={styles.actionLabel}>Add Contact</div>
            </a>

            <a href="/admin/crm/emails/new" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ color: '#ec4899' }}>✉️</div>
              <div className={styles.actionLabel}>Send Email</div>
            </a>

            <a href="/admin/crm/campaigns/new" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ color: '#8b5cf6' }}>📧</div>
              <div className={styles.actionLabel}>Create Campaign</div>
            </a>

            <a href="/admin/crm/deals/new" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ color: '#22c55e' }}>💰</div>
              <div className={styles.actionLabel}>New Deal</div>
            </a>

            <a href="/admin/crm/tickets/new" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ color: '#f59e0b' }}>🎫</div>
              <div className={styles.actionLabel}>New Ticket</div>
            </a>

            <a href="/admin/crm/automations/new" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ color: '#06b6d4' }}>⚙️</div>
              <div className={styles.actionLabel}>Create Automation</div>
            </a>

            <a href="/admin/crm/contacts/import" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ color: '#64748b' }}>📥</div>
              <div className={styles.actionLabel}>Import Contacts</div>
            </a>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Recent Activity */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
              <div className={styles.activityFeed}>
                {activities.length > 0 ? (
                  activities.map((activity, idx) => (
                    <div key={idx} className={styles.activityItem}>
                      <div className={styles.activityHeader}>
                        <div className={styles.activityType}>
                          <span className={styles.activityBadge}>{activity.source}</span>
                          {activity.type.replace('_', ' ')}
                        </div>
                        <div className={styles.activityTime}>
                          {formatDate(activity.created_at)}
                        </div>
                      </div>
                      <div className={styles.activityDescription}>
                        {activity.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.empty}>No recent activity</div>
                )}
              </div>
            </div>

            {/* Top Campaigns */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Top Performing Campaigns</h2>
              <div className={styles.campaignList}>
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <a
                      key={campaign.id}
                      href={`/admin/crm/campaigns/${campaign.id}`}
                      className={styles.campaignItem}
                    >
                      <div className={styles.campaignInfo}>
                        <div className={styles.campaignName}>{campaign.name}</div>
                        <div className={styles.campaignStats}>
                          {campaign.total_sent} sent · {campaign.total_opened} opened
                        </div>
                      </div>
                      <div className={styles.campaignRate}>
                        {campaign.open_rate.toFixed(1)}%
                      </div>
                    </a>
                  ))
                ) : (
                  <div className={styles.empty}>No campaigns yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Pipeline Summary */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Pipeline Summary</h2>
              <div className={styles.pipelineList}>
                {pipeline.length > 0 ? (
                  pipeline
                    .filter(p => p.stage_name !== 'Closed Lost')
                    .map((stage) => (
                      <div key={stage.stage_id} className={styles.pipelineItem}>
                        <div className={styles.pipelineHeader}>
                          <div className={styles.pipelineName}>
                            <span
                              className={styles.stageDot}
                              style={{ backgroundColor: stage.stage_color }}
                            />
                            {stage.stage_name} ({stage.deal_count})
                          </div>
                          <div className={styles.pipelineValue}>
                            {formatCurrency(stage.total_value)}
                          </div>
                        </div>
                        <div className={styles.pipelineBar}>
                          <div
                            className={styles.pipelineBarFill}
                            style={{
                              width: `${(stage.total_value / getMaxPipelineValue()) * 100}%`,
                              backgroundColor: stage.stage_color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                ) : (
                  <div className={styles.empty}>No deals in pipeline</div>
                )}
              </div>
            </div>

            {/* Hot Leads */}
            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>🔥 Hot Leads</h2>
                <a href="/admin/crm/settings/lead-scoring" className={styles.viewAllLink}>
                  Settings
                </a>
              </div>
              <div className={styles.hotLeadsList}>
                {hotLeads.length > 0 ? (
                  hotLeads.map((lead, index) => (
                    <a
                      key={lead.id}
                      href={`/admin/crm/contacts/${lead.id}`}
                      className={styles.hotLeadItem}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        borderBottom: index < hotLeads.length - 1 ? '1px solid #f0f0f0' : 'none',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                          #{index + 1} {lead.firstName || lead.lastName ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : lead.email}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {lead.email}
                        </div>
                      </div>
                      {getScoreBadge(lead.leadScore)}
                    </a>
                  ))
                ) : (
                  <div className={styles.empty}>No scored leads yet</div>
                )}
              </div>
            </div>

            {/* Tickets by Priority */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Open Tickets by Priority</h2>
              <div className={styles.ticketsChart}>
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div key={ticket.priority} className={styles.ticketRow}>
                      <div className={styles.ticketLabel}>
                        <span
                          className={styles.priorityDot}
                          style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                        />
                        {ticket.priority}
                      </div>
                      <div className={styles.ticketCount}>{ticket.count}</div>
                    </div>
                  ))
                ) : (
                  <div className={styles.empty}>No open tickets</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}
