import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../components/admin/AdminLayout';
import { requireSuperAdminAuth } from '@/lib/adminAuth';
import styles from './StripeDashboard.module.css';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Users, RefreshCw } from 'lucide-react';

interface StripeDashboard {
  period: number;
  balance: {
    available: { amount: number; currency: string }[];
    pending: { amount: number; currency: string }[];
  };
  revenue: {
    total: number;
    transactions: number;
    averageValue: number;
  };
  refunds: {
    total: number;
    count: number;
    rate: number;
  };
  subscriptions: {
    active: number;
    canceledInPeriod: number;
    monthlyRecurringRevenue: number;
    details: any[];
  };
  customers: {
    newInPeriod: number;
    withActiveSubscriptions: number;
  };
  paymentMethods: Record<string, number>;
  dailyRevenue: { date: string; revenue: number; transactions: number; refunds: number }[];
  recentTransactions: any[];
}

export default function StripeDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<StripeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stripe/dashboard?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch Stripe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Loading Stripe data...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.error}>Failed to load Stripe data</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Stripe Dashboard</h1>
            <p className={styles.subtitle}>Live sales and financial data from your Stripe account</p>
          </div>
          <div className={styles.controls}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={styles.periodSelect}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button onClick={fetchData} className={styles.refreshButton}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: '#D1FAE5' }}>
              <DollarSign size={20} color="#059669" />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricLabel}>Total Revenue</div>
              <div className={styles.metricValue}>{formatCurrency(data.revenue.total)}</div>
              <div className={styles.metricSubtext}>{data.revenue.transactions} transactions</div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: '#DBEAFE' }}>
              <CreditCard size={20} color="#1e3a8a" />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricLabel}>Avg Transaction</div>
              <div className={styles.metricValue}>{formatCurrency(data.revenue.averageValue)}</div>
              <div className={styles.metricSubtext}>Per transaction</div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: '#FEF3C7' }}>
              <TrendingUp size={20} color="#D97706" />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricLabel}>MRR</div>
              <div className={styles.metricValue}>{formatCurrency(data.subscriptions.monthlyRecurringRevenue)}</div>
              <div className={styles.metricSubtext}>{data.subscriptions.active} active subscriptions</div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: '#FEE2E2' }}>
              <RefreshCw size={20} color="#DC2626" />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricLabel}>Refunds</div>
              <div className={styles.metricValue}>{formatCurrency(data.refunds.total)}</div>
              <div className={styles.metricSubtext}>{data.refunds.rate.toFixed(1)}% refund rate</div>
            </div>
          </div>
        </div>

        {/* Balance Info */}
        <div className={styles.section}>
          <h2>Account Balance</h2>
          <div className={styles.balanceGrid}>
            <div className={styles.balanceCard}>
              <div className={styles.balanceLabel}>Available Balance</div>
              {data.balance.available.map((b, i) => (
                <div key={i} className={styles.balanceAmount}>
                  {formatCurrency(b.amount)} {b.currency}
                </div>
              ))}
            </div>
            <div className={styles.balanceCard}>
              <div className={styles.balanceLabel}>Pending Balance</div>
              {data.balance.pending.map((b, i) => (
                <div key={i} className={styles.balanceAmount}>
                  {formatCurrency(b.amount)} {b.currency}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={styles.section}>
          <h2>Recent Transactions</h2>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th>Description</th>
                  <th>Customer Email</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.created)}</td>
                    <td className={styles.monospace}>{tx.id}</td>
                    <td>{tx.description}</td>
                    <td>{tx.receipt_email || '-'}</td>
                    <td className={styles.capitalize}>{tx.payment_method}</td>
                    <td className={styles.amount}>
                      {formatCurrency(tx.amount)} {tx.currency}
                    </td>
                    <td>
                      <span className={tx.refunded ? styles.refundedBadge : styles.successBadge}>
                        {tx.refunded ? 'Refunded' : 'Succeeded'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className={styles.section}>
          <h2>Active Subscriptions</h2>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Subscription ID</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Interval</th>
                  <th>Status</th>
                  <th>Current Period End</th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.details.map((sub) => (
                  <tr key={sub.id}>
                    <td>{formatDate(sub.created)}</td>
                    <td className={styles.monospace}>{sub.id}</td>
                    <td>{sub.plan}</td>
                    <td className={styles.amount}>{formatCurrency(sub.amount)}</td>
                    <td className={styles.capitalize}>{sub.interval}</td>
                    <td>
                      <span className={styles.activeBadge}>{sub.status}</span>
                    </td>
                    <td>{formatDate(sub.current_period_end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className={styles.section}>
          <h2>Payment Methods</h2>
          <div className={styles.paymentMethods}>
            {Object.entries(data.paymentMethods).map(([method, count]) => (
              <div key={method} className={styles.paymentMethodCard}>
                <div className={styles.paymentMethodName}>{method}</div>
                <div className={styles.paymentMethodCount}>{count} transactions</div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Revenue Chart */}
        <div className={styles.section}>
          <h2>Daily Revenue Trend</h2>
          <div className={styles.chartContainer}>
            <div className={styles.chart}>
              {data.dailyRevenue.map((day, index) => {
                const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 200 : 0;
                return (
                  <div key={day.date} className={styles.chartBar} title={`${day.date}: ${formatCurrency(day.revenue)}`}>
                    <div className={styles.bar} style={{ height: `${height}px` }}>
                      <div className={styles.barLabel}>{formatCurrency(day.revenue)}</div>
                    </div>
                    <div className={styles.barDate}>
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireSuperAdminAuth;
