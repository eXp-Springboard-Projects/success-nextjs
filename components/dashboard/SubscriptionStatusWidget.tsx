import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './SubscriptionStatusWidget.module.css';

interface SubscriptionData {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  cancelAtPeriodEnd: boolean;
  provider: string;
  billingCycle: string | null;
  stripeCustomerId: string | null;
  membershipTier: string;
  nextBillingAmount?: number;
  paymentMethod?: {
    last4: string;
    brand: string;
  };
}

export default function SubscriptionStatusWidget() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/dashboard/subscription-status');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>Loading subscription...</div>
      </div>
    );
  }

  if (!subscription || subscription.status === 'inactive') {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <h3>Subscription Status</h3>
          <span className={`${styles.badge} ${styles.inactive}`}>Inactive</span>
        </div>
        <div className={styles.upgradePrompt}>
          <p>You don't have an active SUCCESS+ subscription.</p>
          <Link href="/subscriptions" className={styles.upgradeBtn}>
            Subscribe to SUCCESS+
          </Link>
        </div>
      </div>
    );
  }

  const isActive = subscription.status.toLowerCase() === 'active';
  const renewalDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;
  const daysUntilRenewal = renewalDate
    ? Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const getTierDisplayName = (tier: string) => {
    if (tier.includes('INSIDER') || tier.includes('Insider')) return 'SUCCESS+ Insider';
    if (tier.includes('COLLECTIVE')) return 'SUCCESS+ Collective';
    if (tier.includes('PREMIUM')) return 'SUCCESS+ Premium';
    return 'SUCCESS+';
  };

  const getBillingCycle = () => {
    if (subscription.billingCycle) {
      return subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly';
    }
    if (subscription.tier?.toLowerCase().includes('annual')) return 'Annual';
    if (subscription.tier?.toLowerCase().includes('monthly')) return 'Monthly';
    return 'Subscription';
  };

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3>Your Subscription</h3>
        <span className={`${styles.badge} ${isActive ? styles.active : styles.warning}`}>
          {subscription.cancelAtPeriodEnd ? 'Cancelling' : subscription.status}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.plan}>
          <div className={styles.planIcon}>⭐</div>
          <div className={styles.planInfo}>
            <h4>{getTierDisplayName(subscription.tier || subscription.membershipTier)}</h4>
            <p className={styles.billingCycle}>{getBillingCycle()}</p>
          </div>
        </div>

        {renewalDate && (
          <div className={styles.renewal}>
            <div className={styles.renewalRow}>
              <span className={styles.label}>
                {subscription.cancelAtPeriodEnd ? 'Expires on:' : 'Renews on:'}
              </span>
              <span className={styles.value}>
                {renewalDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {daysUntilRenewal !== null && daysUntilRenewal <= 7 && !subscription.cancelAtPeriodEnd && (
              <div className={styles.renewalNotice}>
                <span className={styles.noticeIcon}>🔔</span>
                Renews in {daysUntilRenewal} {daysUntilRenewal === 1 ? 'day' : 'days'}
              </div>
            )}
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className={styles.cancelNotice}>
            <p>
              Your subscription will not renew. You'll have access to SUCCESS+ content until{' '}
              {renewalDate?.toLocaleDateString()}.
            </p>
          </div>
        )}

        {subscription.paymentMethod && (
          <div className={styles.paymentInfo}>
            <span className={styles.label}>Payment:</span>
            <span className={styles.value}>
              {subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}
            </span>
          </div>
        )}

        <div className={styles.benefits}>
          <h5>Your Benefits:</h5>
          <ul>
            <li>✓ Unlimited access to premium articles</li>
            <li>✓ Digital magazine library</li>
            <li>✓ Exclusive courses & resources</li>
            <li>✓ Live events & webinars</li>
          </ul>
        </div>

        <div className={styles.actions}>
          {subscription.stripeCustomerId && (
            <Link href="/api/stripe/customer-portal" className={styles.manageBtn}>
              Manage Billing
            </Link>
          )}
          <Link href="/dashboard/settings?tab=subscription" className={styles.settingsLink}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
