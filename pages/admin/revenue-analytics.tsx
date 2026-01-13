import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Revenue.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface RevenueAnalytics {
  totalRevenue: number;
  revenueGrowth: number;
  mrr: number;
  averageOrderValue: number;
  aovGrowth: number;
  totalTransactions: number;
  transactionsGrowth: number;
  refundRate: number;
  refundRateChange: number;
  averageClv: number;
  previousPeriod: {
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
    refundRate: number;
  };
  revenueByProvider: Record<string, number>;
  revenueByProductType: Record<string, number>;
  newVsReturning: {
    newCustomerRevenue: number;
    returningCustomerRevenue: number;
  };
  activeSubscriptions: number;
  newSubscriptions: number;
  newSubscriptionsGrowth: number;
  dailyRevenue: { date: string; revenue: number; transactions: number; refunds: number }[];
  refundCount: number;
  refundAmount: number;
}

export default function RevenueAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Date range state
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | '90days' | 'year' | 'alltime' | 'custom'>('alltime');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      updateDateRange(dateRange);
    }
  }, [session, dateRange]);

  const updateDateRange = (range: typeof dateRange) => {
    const now = new Date();
    let start: Date;
    let end = new Date(now);

    switch (range) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'alltime':
        start = new Date('2020-01-01'); // All time from 2020
        break;
      case 'custom':
        return; // Don't auto-fetch for custom range
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    fetchAnalytics(start.toISOString(), end.toISOString());
  };

  const fetchAnalytics = async (start?: string, end?: string) => {
    const startParam = start || startDate;
    const endParam = end || endDate;

    if (!startParam || !endParam) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/revenue/analytics?startDate=${startParam}&endDate=${endParam}&compareWithPrevious=${compareWithPrevious}`
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const csvRows = [
      ['Revenue Analytics Export', ''],
      ['Date Range', `${startDate} to ${endDate}`],
      [''],
      ['Key Metrics', ''],
      ['Total Revenue', `$${analytics.totalRevenue.toFixed(2)}`],
      ['Revenue Growth', `${analytics.revenueGrowth.toFixed(1)}%`],
      ['MRR', `$${analytics.mrr.toFixed(2)}`],
      ['Average Order Value', `$${analytics.averageOrderValue.toFixed(2)}`],
      ['AOV Growth', `${analytics.aovGrowth.toFixed(1)}%`],
      ['Total Transactions', analytics.totalTransactions],
      ['Transactions Growth', `${analytics.transactionsGrowth.toFixed(1)}%`],
      ['Refund Rate', `${analytics.refundRate.toFixed(2)}%`],
      ['Refund Amount', `$${analytics.refundAmount.toFixed(2)}`],
      ['Average CLV', `$${analytics.averageClv.toFixed(2)}`],
      [''],
      ['Revenue by Provider', ''],
      ...Object.entries(analytics.revenueByProvider).map(([provider, amount]) => [provider, `$${amount.toFixed(2)}`]),
      [''],
      ['Revenue by Product Type', ''],
      ...Object.entries(analytics.revenueByProductType).map(([type, amount]) => [type, `$${amount.toFixed(2)}`]),
      [''],
      ['New vs Returning Customers', ''],
      ['New Customer Revenue', `$${analytics.newVsReturning.newCustomerRevenue.toFixed(2)}`],
      ['Returning Customer Revenue', `$${analytics.newVsReturning.returningCustomerRevenue.toFixed(2)}`],
      [''],
      ['Daily Revenue', ''],
      ['Date', 'Revenue', 'Transactions', 'Refunds'],
      ...analytics.dailyRevenue.map(d => [d.date, `$${d.revenue.toFixed(2)}`, d.transactions, `$${d.refunds.toFixed(2)}`]),
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-analytics-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  const exportToPDF = async () => {
    if (!analytics || !dashboardRef.current) return;

    setExportingPDF(true);
    try {
      // Dynamically import libraries
      const html2canvasModule = await import('html2canvas');
      const html2canvasFunc = html2canvasModule.default;
      const { jsPDF } = await import('jspdf');

      // Create canvas from dashboard
      const canvas = await html2canvasFunc(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      // Add metadata
      pdf.setProperties({
        title: `Revenue Analytics ${startDate} to ${endDate}`,
        subject: 'Revenue Analytics Report',
        author: 'SUCCESS Admin',
        keywords: 'revenue, analytics, report',
        creator: 'SUCCESS Admin Dashboard',
      });

      pdf.save(`revenue-analytics-${startDate}-to-${endDate}.pdf`);
    } catch (error) {
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading analytics...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Revenue Analytics</h1>
            <p className={styles.subtitle}>Comprehensive revenue insights from all payment sources</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={exportToCSV}
              disabled={!analytics}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: analytics ? 'pointer' : 'not-allowed',
                fontSize: '14px',
              }}
            >
              📊 Export CSV
            </button>
            <button
              onClick={exportToPDF}
              disabled={!analytics || exportingPDF}
              style={{
                padding: '10px 20px',
                background: exportingPDF ? '#9ca3af' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: analytics && !exportingPDF ? 'pointer' : 'not-allowed',
                fontSize: '14px',
              }}
            >
              {exportingPDF ? '⏳ Generating...' : '📄 Export PDF'}
            </button>
          </div>
        </div>

        {/* Date Range Filters */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, marginRight: '8px' }}>Date Range:</span>

            {(['alltime', 'year', '90days', '30days', '7days', 'today'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: '8px 16px',
                  background: dateRange === range ? '#667eea' : '#f3f4f6',
                  color: dateRange === range ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {range === 'alltime' && 'All Time'}
                {range === 'today' && 'Today'}
                {range === '7days' && 'Last 7 Days'}
                {range === '30days' && 'Last 30 Days'}
                {range === '90days' && 'Last 90 Days'}
                {range === 'year' && 'This Year'}
              </button>
            ))}

            <button
              onClick={() => setDateRange('custom')}
              style={{
                padding: '8px 16px',
                background: dateRange === 'custom' ? '#667eea' : '#f3f4f6',
                color: dateRange === 'custom' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Custom Range
            </button>

            {dateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={handleCustomDateApply}
                  style={{
                    padding: '8px 16px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Apply
                </button>
              </>
            )}

            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={compareWithPrevious}
                onChange={(e) => {
                  setCompareWithPrevious(e.target.checked);
                  setTimeout(() => fetchAnalytics(), 100);
                }}
              />
              <span style={{ fontSize: '14px' }}>Compare with previous period</span>
            </label>
          </div>
        </div>

        {/* Dashboard Content (for PDF export) */}
        {analytics && (
          <div ref={dashboardRef}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#667eea' }}>💰</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Total Revenue</div>
                  <div className={styles.statValue}>{formatCurrency(analytics.totalRevenue)}</div>
                  {compareWithPrevious && (
                    <div style={{
                      fontSize: '14px',
                      color: analytics.revenueGrowth >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                      marginTop: '4px',
                    }}>
                      {formatPercent(analytics.revenueGrowth)}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#43e97b' }}>📈</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Monthly Recurring Revenue</div>
                  <div className={styles.statValue}>{formatCurrency(analytics.mrr)}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    {analytics.activeSubscriptions} active subscriptions
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#4facfe' }}>🛒</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Average Order Value</div>
                  <div className={styles.statValue}>{formatCurrency(analytics.averageOrderValue)}</div>
                  {compareWithPrevious && (
                    <div style={{
                      fontSize: '14px',
                      color: analytics.aovGrowth >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                      marginTop: '4px',
                    }}>
                      {formatPercent(analytics.aovGrowth)}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#f093fb' }}>📊</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Total Transactions</div>
                  <div className={styles.statValue}>{analytics.totalTransactions}</div>
                  {compareWithPrevious && (
                    <div style={{
                      fontSize: '14px',
                      color: analytics.transactionsGrowth >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                      marginTop: '4px',
                    }}>
                      {formatPercent(analytics.transactionsGrowth)}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#fa709a' }}>↩️</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Refund Rate</div>
                  <div className={styles.statValue}>{analytics.refundRate.toFixed(2)}%</div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    {formatCurrency(analytics.refundAmount)} refunded
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#ffa94d' }}>💎</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Customer Lifetime Value</div>
                  <div className={styles.statValue}>{formatCurrency(analytics.averageClv)}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    Average per customer
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue by Provider Chart */}
            <div className={styles.chartSection} style={{ marginTop: '32px' }}>
              <h2>Revenue by Payment Provider</h2>
              <div className={styles.chartCard}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '20px' }}>
                  {Object.entries(analytics.revenueByProvider).map(([provider, amount]) => {
                    const total = Object.values(analytics.revenueByProvider).reduce((sum, v) => sum + v, 0);
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    return (
                      <div key={provider} style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: `conic-gradient(#667eea 0% ${percentage}%, #e5e7eb ${percentage}% 100%)`,
                          margin: '0 auto 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <div style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                          }}>
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{provider}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>{formatCurrency(amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Revenue by Product Type Chart */}
            <div className={styles.chartSection}>
              <h2>Revenue by Product Type</h2>
              <div className={styles.chartCard}>
                <div style={{ padding: '20px' }}>
                  {Object.entries(analytics.revenueByProductType).map(([type, amount]) => {
                    const total = Object.values(analytics.revenueByProductType).reduce((sum, v) => sum + v, 0);
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    return (
                      <div key={type} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{type}</span>
                          <span>{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div style={{
                          height: '24px',
                          background: '#e5e7eb',
                          borderRadius: '12px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            transition: 'width 0.3s',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* New vs Returning Customer Revenue */}
            <div className={styles.chartSection}>
              <h2>New vs Returning Customer Revenue</h2>
              <div className={styles.chartCard}>
                <div style={{ display: 'flex', gap: '40px', padding: '40px', justifyContent: 'center' }}>
                  {[
                    { label: 'New Customers', amount: analytics.newVsReturning.newCustomerRevenue, color: '#10b981' },
                    { label: 'Returning Customers', amount: analytics.newVsReturning.returningCustomerRevenue, color: '#667eea' },
                  ].map(({ label, amount, color }) => {
                    const total = analytics.newVsReturning.newCustomerRevenue + analytics.newVsReturning.returningCustomerRevenue;
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    return (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '160px',
                          height: '160px',
                          borderRadius: '50%',
                          background: color,
                          margin: '0 auto 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}>
                          <div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{percentage.toFixed(0)}%</div>
                            <div style={{ fontSize: '14px' }}>{formatCurrency(amount)}</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '16px' }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Daily Revenue Trend */}
            <div className={styles.chartSection}>
              <h2>Daily Revenue Trend</h2>
              <div className={styles.chartCard}>
                {analytics.dailyRevenue.length > 0 ? (
                  <div style={{ padding: '20px', overflowX: 'auto' }}>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'flex-end',
                      minWidth: `${analytics.dailyRevenue.length * 40}px`,
                      height: '300px',
                    }}>
                      {analytics.dailyRevenue.map((day, index) => {
                        const maxRevenue = Math.max(...analytics.dailyRevenue.map(d => d.revenue));
                        const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                        return (
                          <div
                            key={index}
                            style={{
                              flex: '1 1 0',
                              minWidth: '30px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div
                              title={`${day.date}\n${formatCurrency(day.revenue)}\n${day.transactions} transactions`}
                              style={{
                                width: '100%',
                                height: `${height}%`,
                                background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '4px 4px 0 0',
                                cursor: 'pointer',
                                minHeight: day.revenue > 0 ? '4px' : '0',
                              }}
                            />
                            <div style={{
                              fontSize: '10px',
                              color: '#6b7280',
                              transform: 'rotate(-45deg)',
                              whiteSpace: 'nowrap',
                            }}>
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyChart}>
                    <p>No revenue data available for this period</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
