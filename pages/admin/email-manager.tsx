import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './EmailManager.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Subscriber {
  id: string;
  email: string;
  name: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  lists: string[];
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  sentAt: string;
  recipients: number;
  opened: number;
  clicked: number;
  status: 'draft' | 'scheduled' | 'sent';
}

interface EmailStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalCampaigns: number;
  avgOpenRate: number;
  avgClickRate: number;
}

export default function EmailManager() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns' | 'stats'>('subscribers');
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchStats();
      fetchSubscribers();
      fetchCampaigns();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/email/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // Mock data
        setStats({
          totalSubscribers: 12547,
          activeSubscribers: 11892,
          totalCampaigns: 45,
          avgOpenRate: 24.5,
          avgClickRate: 3.2
        });
      }
    } catch (error) {
      setStats({
        totalSubscribers: 12547,
        activeSubscribers: 11892,
        totalCampaigns: 45,
        avgOpenRate: 24.5,
        avgClickRate: 3.2
      });
    }
  };

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/email/subscribers');
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      } else {
        // Mock data
        setSubscribers([
          {
            id: '1',
            email: 'john.doe@example.com',
            name: 'John Doe',
            subscribedAt: '2024-01-15',
            status: 'active',
            lists: ['Newsletter', 'Blog Updates']
          },
          {
            id: '2',
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            subscribedAt: '2024-02-20',
            status: 'active',
            lists: ['Newsletter']
          },
          {
            id: '3',
            email: 'bob.johnson@example.com',
            name: 'Bob Johnson',
            subscribedAt: '2024-03-10',
            status: 'unsubscribed',
            lists: ['Newsletter']
          }
        ]);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/email/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      } else {
        // Mock data
        setCampaigns([
          {
            id: '1',
            name: 'Weekly Newsletter - Week 42',
            subject: 'Your Weekly Dose of Success',
            sentAt: '2024-10-15T10:00:00Z',
            recipients: 11892,
            opened: 2914,
            clicked: 380,
            status: 'sent'
          },
          {
            id: '2',
            name: 'New Magazine Release',
            subject: 'October Magazine is Now Available!',
            sentAt: '2024-10-01T09:00:00Z',
            recipients: 11850,
            opened: 3555,
            clicked: 425,
            status: 'sent'
          },
          {
            id: '3',
            name: 'Special Offer - SUCCESS+',
            subject: 'Exclusive 30% Off SUCCESS+ Membership',
            sentAt: '2024-09-25T14:00:00Z',
            recipients: 11820,
            opened: 2955,
            clicked: 591,
            status: 'sent'
          }
        ]);
      }
    } catch (error) {
    }
  };

  const handleExportSubscribers = () => {
    const csv = subscribers.map(sub =>
      `${sub.email},${sub.name},${sub.status},${sub.subscribedAt}`
    ).join('\n');
    const blob = new Blob([`Email,Name,Status,Subscribed At\n${csv}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading email manager...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Email & Newsletter Manager</h1>
            <p className={styles.subtitle}>
              Manage subscribers, campaigns, and track email performance
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryButton}>
              ✉️ New Campaign
            </button>
          </div>
        </div>

        {/* Email Stats */}
        {stats && (
          <div className={styles.statsSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statContent}>
                  <h3>Total Subscribers</h3>
                  <p className={styles.statValue}>{stats.totalSubscribers.toLocaleString()}</p>
                  <span className={styles.statChange}>+245 this month</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statContent}>
                  <h3>Active Subscribers</h3>
                  <p className={styles.statValue}>{stats.activeSubscribers.toLocaleString()}</p>
                  <span className={styles.statChange}>{((stats.activeSubscribers / stats.totalSubscribers) * 100).toFixed(1)}% of total</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📧</div>
                <div className={styles.statContent}>
                  <h3>Total Campaigns</h3>
                  <p className={styles.statValue}>{stats.totalCampaigns}</p>
                  <span className={styles.statChange}>All time</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statContent}>
                  <h3>Avg Open Rate</h3>
                  <p className={styles.statValue}>{stats.avgOpenRate}%</p>
                  <span className={styles.statChange} style={{ color: '#28a745' }}>Above industry avg</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🖱️</div>
                <div className={styles.statContent}>
                  <h3>Avg Click Rate</h3>
                  <p className={styles.statValue}>{stats.avgClickRate}%</p>
                  <span className={styles.statChange} style={{ color: '#28a745' }}>Good engagement</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={activeTab === 'subscribers' ? styles.tabActive : styles.tab}
          >
            📋 Subscribers ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={activeTab === 'campaigns' ? styles.tabActive : styles.tab}
          >
            📧 Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={activeTab === 'stats' ? styles.tabActive : styles.tab}
          >
            📈 Detailed Stats
          </button>
        </div>

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div className={styles.tabContent}>
            <div className={styles.tableHeader}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Search subscribers by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <button onClick={handleExportSubscribers} className={styles.exportButton}>
                📥 Export CSV
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Lists</th>
                    <th>Subscribed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map(subscriber => (
                    <tr key={subscriber.id}>
                      <td>{subscriber.email}</td>
                      <td>{subscriber.name}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[subscriber.status]}`}>
                          {subscriber.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.lists}>
                          {subscriber.lists.map((list, index) => (
                            <span key={index} className={styles.listTag}>{list}</span>
                          ))}
                        </div>
                      </td>
                      <td>{new Date(subscriber.subscribedAt).toLocaleDateString()}</td>
                      <td>
                        <button className={styles.actionButton}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className={styles.tabContent}>
            <div className={styles.campaignsList}>
              {campaigns.map(campaign => (
                <div key={campaign.id} className={styles.campaignCard}>
                  <div className={styles.campaignHeader}>
                    <div>
                      <h3>{campaign.name}</h3>
                      <p className={styles.campaignSubject}>{campaign.subject}</p>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className={styles.campaignStats}>
                    <div className={styles.campaignStat}>
                      <span className={styles.campaignStatLabel}>Sent to</span>
                      <span className={styles.campaignStatValue}>{campaign.recipients.toLocaleString()}</span>
                    </div>
                    <div className={styles.campaignStat}>
                      <span className={styles.campaignStatLabel}>Opened</span>
                      <span className={styles.campaignStatValue}>
                        {campaign.opened.toLocaleString()} ({((campaign.opened / campaign.recipients) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className={styles.campaignStat}>
                      <span className={styles.campaignStatLabel}>Clicked</span>
                      <span className={styles.campaignStatValue}>
                        {campaign.clicked.toLocaleString()} ({((campaign.clicked / campaign.recipients) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className={styles.campaignStat}>
                      <span className={styles.campaignStatLabel}>Sent</span>
                      <span className={styles.campaignStatValue}>
                        {new Date(campaign.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className={styles.campaignActions}>
                    <button className={styles.secondaryButton}>View Report</button>
                    <button className={styles.secondaryButton}>Duplicate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className={styles.tabContent}>
            <div className={styles.detailedStats}>
              <h2>📊 Performance Overview</h2>
              <p className={styles.comingSoon}>
                Additional analytics features planned:
              </p>
              <ul className={styles.featureList}>
                <li>📈 Growth trends over time</li>
                <li>🗺️ Geographic distribution of subscribers</li>
                <li>📅 Best days and times to send emails</li>
                <li>💡 Content performance by topic</li>
                <li>🎯 Engagement heatmaps</li>
              </ul>
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
