/**
 * Sales & Customer Service Dashboard
 * Consolidated view of all revenue streams, customers, and CS operations
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Link from 'next/link';
import styles from './SalesCS.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalCustomers: number;
  pendingOrders: number;
  emailSubscribers: number;
  averageOrderValue: number;
  churnRate: number;
}

export default function SalesCustomerServiceDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
        router.push('/admin');
      } else {
        fetchDashboardStats();
      }
    }
  }, [status, session, router]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/admin/sales-cs/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      title: 'All Transactions',
      description: 'View all sales, orders, and payments',
      href: '/admin/sales',
      icon: '💰',
      color: '#10b981',
    },
    {
      title: 'Customers',
      description: 'Manage customer accounts and profiles',
      href: '/admin/users',
      icon: '⭐',
      color: '#f59e0b',
    },
    {
      title: 'Email Subscribers',
      description: 'Manage newsletter and email subscribers',
      href: '/admin/subscribers',
      icon: '👥',
      color: '#3b82f6',
    },
    {
      title: 'Subscriptions',
      description: 'Manage SUCCESS+ and magazine subscriptions',
      href: '/admin/subscriptions',
      icon: '💳',
      color: '#8b5cf6',
    },
    {
      title: 'Orders & Fulfillment',
      description: 'Track and fulfill physical product orders',
      href: '/admin/orders',
      icon: '📦',
      color: '#ec4899',
    },
    {
      title: 'Revenue Analytics',
      description: 'Financial reports and revenue metrics',
      href: '/admin/revenue',
      icon: '📊',
      color: '#06b6d4',
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading dashboard...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Sales & Customer Service</h1>
          <p>Unified dashboard for all revenue streams and customer operations</p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#10b981' }}>💰</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                ${stats?.totalRevenue?.toLocaleString() || '0'}
              </div>
              <div className={styles.statLabel}>Total Revenue</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#3b82f6' }}>📈</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                ${stats?.monthlyRevenue?.toLocaleString() || '0'}
              </div>
              <div className={styles.statLabel}>Monthly Revenue</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#8b5cf6' }}>💳</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {stats?.activeSubscriptions?.toLocaleString() || '0'}
              </div>
              <div className={styles.statLabel}>Active Subscriptions</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#f59e0b' }}>⭐</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {stats?.totalCustomers?.toLocaleString() || '0'}
              </div>
              <div className={styles.statLabel}>Total Customers</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#ec4899' }}>📦</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {stats?.pendingOrders?.toLocaleString() || '0'}
              </div>
              <div className={styles.statLabel}>Pending Orders</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#06b6d4' }}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {stats?.emailSubscribers?.toLocaleString() || '0'}
              </div>
              <div className={styles.statLabel}>Email Subscribers</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#10b981' }}>💵</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                ${stats?.averageOrderValue?.toFixed(2) || '0.00'}
              </div>
              <div className={styles.statLabel}>Avg Order Value</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#ef4444' }}>📉</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {stats?.churnRate?.toFixed(1) || '0.0'}%
              </div>
              <div className={styles.statLabel}>Churn Rate</div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.section}>
          <h2>Quick Access</h2>
          <div className={styles.quickLinksGrid}>
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.quickLink}>
                <div className={styles.quickLinkIcon} style={{ background: link.color }}>
                  {link.icon}
                </div>
                <div className={styles.quickLinkContent}>
                  <h3>{link.title}</h3>
                  <p>{link.description}</p>
                </div>
                <div className={styles.quickLinkArrow}>→</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.section}>
          <h2>Recent Activity</h2>
          <div className={styles.activityPlaceholder}>
            <p>Recent transactions, subscription changes, and customer activities will appear here.</p>
            <p className={styles.note}>
              Note: This dashboard aggregates data from Stripe, PayKickstart, and WooCommerce.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
