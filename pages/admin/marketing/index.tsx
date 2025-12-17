import { useEffect, useState } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './Marketing.module.css';

interface DashboardStats {
  siteTrafficToday: number;
  emailOpenRate: number;
  activeCampaigns: number;
  conversionRate: number;
  topCampaigns: Array<{
    id: string;
    name: string;
    type: string;
    conversions: number;
    clickThroughRate: number;
  }>;
}

export default function MarketingDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    siteTrafficToday: 0,
    emailOpenRate: 0,
    activeCampaigns: 0,
    conversionRate: 0,
    topCampaigns: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/marketing/dashboard-stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch dashboard stats:', error);
        setLoading(false);
      });
  }, []);

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="Marketing Dashboard"
      description="Campaigns, analytics, and growth initiatives"
    >
      <div className={styles.dashboard}>
        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Site Traffic Today</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.siteTrafficToday.toLocaleString()}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📧</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Email Open Rate</div>
              <div className={styles.statValue}>
                {loading ? '...' : `${stats.emailOpenRate.toFixed(1)}%`}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Active Campaigns</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.activeCampaigns}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Conversion Rate</div>
              <div className={styles.statValue}>
                {loading ? '...' : `${stats.conversionRate.toFixed(2)}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link href="/admin/crm/campaigns/new" className={styles.actionCard}>
              <div className={styles.actionIcon}>🚀</div>
              <div className={styles.actionTitle}>Create Campaign</div>
              <div className={styles.actionDescription}>
                Launch a new marketing campaign
              </div>
            </Link>

            <Link href="/admin/crm/campaigns/new?type=newsletter" className={styles.actionCard}>
              <div className={styles.actionIcon}>✉️</div>
              <div className={styles.actionTitle}>Send Newsletter</div>
              <div className={styles.actionDescription}>
                Compose and send email campaign
              </div>
            </Link>

            <Link href="/admin/crm/analytics" className={styles.actionCard}>
              <div className={styles.actionIcon}>📈</div>
              <div className={styles.actionTitle}>View Analytics</div>
              <div className={styles.actionDescription}>
                Traffic and conversion metrics
              </div>
            </Link>

            <Link href="/admin/crm/forms" className={styles.actionCard}>
              <div className={styles.actionIcon}>📄</div>
              <div className={styles.actionTitle}>Landing Pages</div>
              <div className={styles.actionDescription}>
                Create and manage landing pages
              </div>
            </Link>

            <Link href="/admin/crm/promotions" className={styles.actionCard}>
              <div className={styles.actionIcon}>🎁</div>
              <div className={styles.actionTitle}>Promotions</div>
              <div className={styles.actionDescription}>
                Manage coupon codes and offers
              </div>
            </Link>

            <Link href="/admin/crm/campaigns" className={styles.actionCard}>
              <div className={styles.actionIcon}>📋</div>
              <div className={styles.actionTitle}>All Campaigns</div>
              <div className={styles.actionDescription}>
                View campaign performance
              </div>
            </Link>
          </div>
        </div>

        {/* Top Campaigns */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Top Performing Campaigns</h2>
          <div className={styles.campaignsList}>
            {loading ? (
              <div className={styles.emptyState}>Loading...</div>
            ) : stats.topCampaigns.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📊</div>
                <div>No campaign data available</div>
              </div>
            ) : (
              stats.topCampaigns.map((campaign) => {
                const getTypeColor = (type: string) => {
                  switch (type) {
                    case 'Email': return '#3b82f6';
                    case 'Social': return '#8b5cf6';
                    case 'Paid': return '#f59e0b';
                    case 'Content': return '#10b981';
                    default: return '#6b7280';
                  }
                };

                return (
                  <div key={campaign.id} className={styles.campaignItem}>
                    <div className={styles.campaignInfo}>
                      <div className={styles.campaignName}>{campaign.name}</div>
                      <div
                        className={styles.campaignType}
                        style={{ background: getTypeColor(campaign.type) }}
                      >
                        {campaign.type}
                      </div>
                    </div>
                    <div className={styles.campaignMetrics}>
                      <div className={styles.metric}>
                        <div className={styles.metricValue}>{campaign.conversions}</div>
                        <div className={styles.metricLabel}>Conversions</div>
                      </div>
                      <div className={styles.metric}>
                        <div className={styles.metricValue}>{campaign.clickThroughRate.toFixed(1)}%</div>
                        <div className={styles.metricLabel}>CTR</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.MARKETING);
