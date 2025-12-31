import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';
import billingStyles from './billing.module.css';

interface Subscription {
  tier: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  interval: string;
}

interface Order {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  invoiceUrl?: string;
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/billing');
    } else if (status === 'authenticated') {
      fetchBillingData();
    }
  }, [status]);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/dashboard/billing');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    window.open('https://mysuccessplus.com/billing/manage', '_blank');
  };

  const getStatusBadge = (status: string) => {
    const statusClass = status === 'active' ? billingStyles.statusActive :
                       status === 'trialing' ? billingStyles.statusTrial :
                       status === 'past_due' ? billingStyles.statusPastDue :
                       billingStyles.statusInactive;
    return <span className={statusClass}>{status}</span>;
  };

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Billing & Orders - SUCCESS+</title>
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Link href="/dashboard">
              <img src="/success-logo.png" alt="SUCCESS" />
            </Link>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button><span className={styles.icon}>📊</span> Dashboard</button>
            </Link>
            <Link href="/dashboard/premium">
              <button><span className={styles.icon}>⭐</span> Premium Content</button>
            </Link>
            <Link href="/dashboard/courses">
              <button><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/disc-profile">
              <button><span className={styles.icon}>🎯</span> My DISC Profile</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resource Library</button>
            </Link>
            <Link href="/dashboard/community">
              <button><span className={styles.icon}>👥</span> Community</button>
            </Link>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events Calendar</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazine</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcast</button>
            </Link>
            <Link href="/dashboard/shop">
              <button><span className={styles.icon}>🛍️</span> Shop</button>
            </Link>
            <Link href="/dashboard/help">
              <button><span className={styles.icon}>❓</span> Help Center</button>
            </Link>
            <Link href="/dashboard/billing">
              <button className={styles.active}><span className={styles.icon}>💳</span> Billing & Orders</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Billing & Orders</h1>
            <p className={styles.subtitle}>Manage your subscription and view your order history</p>
          </div>

          {subscription ? (
            <div className={billingStyles.subscriptionCard}>
              <div className={billingStyles.subscriptionHeader}>
                <div>
                  <h2>SUCCESS+ {subscription.tier}</h2>
                  <p>Your current subscription</p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>

              <div className={billingStyles.subscriptionDetails}>
                <div className={billingStyles.detailRow}>
                  <span className={billingStyles.detailLabel}>Billing Amount</span>
                  <span className={billingStyles.detailValue}>
                    ${subscription.amount.toFixed(2)}/{subscription.interval}
                  </span>
                </div>
                <div className={billingStyles.detailRow}>
                  <span className={billingStyles.detailLabel}>
                    {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing Date'}
                  </span>
                  <span className={billingStyles.detailValue}>
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <div className={billingStyles.cancelNotice}>
                    ⚠️ Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className={billingStyles.subscriptionActions}>
                <button
                  className={billingStyles.primaryBtn}
                  onClick={handleManageSubscription}
                >
                  Manage Subscription
                </button>
                <button
                  className={billingStyles.secondaryBtn}
                  onClick={() => window.open('https://mysuccessplus.com/billing/payment-methods', '_blank')}
                >
                  Update Payment Method
                </button>
              </div>
            </div>
          ) : (
            <div className={billingStyles.noSubscription}>
              <div className={billingStyles.noSubIcon}>📋</div>
              <h2>No Active Subscription</h2>
              <p>You don't have an active SUCCESS+ subscription</p>
              <Link href="/subscribe" className={billingStyles.subscribeBtn}>
                Subscribe Now
              </Link>
            </div>
          )}

          <div className={billingStyles.ordersSection}>
            <h2>Order History</h2>

            {orders.length > 0 ? (
              <div className={billingStyles.ordersTable}>
                <div className={billingStyles.tableHeader}>
                  <div>Date</div>
                  <div>Description</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div>Invoice</div>
                </div>
                {orders.map(order => (
                  <div key={order.id} className={billingStyles.tableRow}>
                    <div>{new Date(order.date).toLocaleDateString()}</div>
                    <div>{order.description}</div>
                    <div>${order.amount.toFixed(2)}</div>
                    <div>{getStatusBadge(order.status)}</div>
                    <div>
                      {order.invoiceUrl ? (
                        <button
                          className={billingStyles.invoiceBtn}
                          onClick={() => window.open(order.invoiceUrl, '_blank')}
                        >
                          View Invoice
                        </button>
                      ) : (
                        <span className={billingStyles.noInvoice}>—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={billingStyles.emptyOrders}>
                <div className={billingStyles.emptyIcon}>📭</div>
                <p>No orders yet</p>
              </div>
            )}
          </div>

          <div className={billingStyles.billingInfo}>
            <h2>Billing Information</h2>
            <div className={billingStyles.infoGrid}>
              <div className={billingStyles.infoCard}>
                <div className={billingStyles.infoIcon}>🔒</div>
                <h3>Secure Payments</h3>
                <p>All transactions are encrypted and secure</p>
              </div>
              <div className={billingStyles.infoCard}>
                <div className={billingStyles.infoIcon}>📧</div>
                <h3>Email Receipts</h3>
                <p>You'll receive a receipt for every payment</p>
              </div>
              <div className={billingStyles.infoCard}>
                <div className={billingStyles.infoIcon}>🔄</div>
                <h3>Cancel Anytime</h3>
                <p>No long-term commitments required</p>
              </div>
              <div className={billingStyles.infoCard}>
                <div className={billingStyles.infoIcon}>💯</div>
                <h3>Money-Back Guarantee</h3>
                <p>30-day satisfaction guarantee</p>
              </div>
            </div>
          </div>

          <div className={billingStyles.supportSection}>
            <h3>Need Help with Billing?</h3>
            <p>Contact our support team for assistance with your subscription or billing questions.</p>
            <div className={billingStyles.supportButtons}>
              <Link href="/dashboard/help" className={billingStyles.helpBtn}>
                Visit Help Center
              </Link>
              <button
                className={billingStyles.contactBtn}
                onClick={() => window.open('mailto:billing@success.com')}
              >
                Email Billing Support
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
