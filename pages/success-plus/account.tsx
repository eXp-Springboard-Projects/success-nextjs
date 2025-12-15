import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from './account.module.css';

interface SubscriptionInfo {
  status: string;
  tier: string;
  billingCycle: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface TrialStatus {
  isTrialActive: boolean;
  daysRemaining: number;
  trialEndsAt: string | null;
  membershipTier: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/success-plus/account');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchAccountInfo();
    }
  }, [session]);

  async function fetchAccountInfo() {
    try {
      // Fetch trial status
      const trialRes = await fetch('/api/user/trial-status');
      if (trialRes.ok) {
        const trialData = await trialRes.json();
        setTrialStatus(trialData);
      }

      // Fetch subscription info
      const subRes = await fetch('/api/user/subscription');
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }
    } catch (err) {
      console.error('Failed to fetch account info:', err);
    }
  }

  async function handleManageBilling() {
    setLoading(true);

    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to access billing portal');
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      alert(err instanceof Error ? err.message : 'Failed to access billing portal');
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const hasActiveSubscription = subscription && subscription.status === 'ACTIVE';
  const isOnTrial = trialStatus?.isTrialActive;

  return (
    <>
      <Head>
        <title>My Account | SUCCESS+</title>
        <meta name="description" content="Manage your SUCCESS+ subscription" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>My Account</h1>
          <p>Manage your SUCCESS+ subscription and billing</p>
        </div>

        {/* Trial Status */}
        {isOnTrial && !hasActiveSubscription && (
          <div className={styles.trialCard}>
            <div className={styles.trialHeader}>
              <span className={styles.trialIcon}>🎁</span>
              <h2>Free Trial Active</h2>
            </div>
            <p className={styles.trialInfo}>
              You have <strong>{trialStatus.daysRemaining} days</strong> remaining in your 7-day free trial.
            </p>
            <p className={styles.trialExpires}>
              Trial ends on {new Date(trialStatus.trialEndsAt!).toLocaleDateString()}
            </p>
            <Link href="/success-plus/upgrade" className={styles.upgradeButton}>
              Upgrade to Keep Access
            </Link>
          </div>
        )}

        {/* Active Subscription */}
        {hasActiveSubscription && (
          <div className={styles.subscriptionCard}>
            <div className={styles.subscriptionHeader}>
              <div>
                <h2>SUCCESS+ {subscription.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'}</h2>
                <span className={styles.statusBadge}>
                  {subscription.status}
                </span>
              </div>
              <div className={styles.subscriptionPrice}>
                <span className={styles.price}>
                  ${subscription.billingCycle === 'ANNUAL' ? '79.99' : '7.99'}
                </span>
                <span className={styles.period}>
                  /{subscription.billingCycle === 'ANNUAL' ? 'year' : 'month'}
                </span>
              </div>
            </div>

            <div className={styles.subscriptionDetails}>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Next billing date:</span>
                <span className={styles.detailValue}>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className={styles.cancelNotice}>
                  ⚠️ Your subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>

            <button
              onClick={handleManageBilling}
              disabled={loading}
              className={styles.manageButton}
            >
              {loading ? 'Loading...' : 'Manage Billing'}
            </button>
            <p className={styles.manageInfo}>
              Update payment method, view invoices, or cancel subscription
            </p>
          </div>
        )}

        {/* No Subscription */}
        {!hasActiveSubscription && !isOnTrial && (
          <div className={styles.noSubscription}>
            <span className={styles.icon}>📋</span>
            <h2>No Active Subscription</h2>
            <p>Subscribe to SUCCESS+ to unlock premium content and features</p>
            <Link href="/success-plus/upgrade" className={styles.subscribeButton}>
              View Plans & Pricing
            </Link>
          </div>
        )}

        {/* Account Benefits */}
        <div className={styles.benefits}>
          <h3>Your SUCCESS+ Benefits</h3>
          <div className={styles.benefitsList}>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>📚</span>
              <div>
                <h4>Unlimited Premium Content</h4>
                <p>Access all exclusive articles, guides, and insights</p>
              </div>
            </div>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>🎥</span>
              <div>
                <h4>Exclusive Video Content</h4>
                <p>Watch interviews, courses, and behind-the-scenes content</p>
              </div>
            </div>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>📥</span>
              <div>
                <h4>Downloadable Resources</h4>
                <p>Templates, worksheets, and tools to accelerate your success</p>
              </div>
            </div>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>🧪</span>
              <div>
                <h4>SUCCESS Labs Access</h4>
                <p>AI-powered coaching and exclusive community of high achievers</p>
                <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" style={{color: '#c41e3a', textDecoration: 'underline', fontSize: '0.9rem'}}>
                  Visit SUCCESS Labs →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className={styles.help}>
          <h3>Need Help?</h3>
          <p>
            Questions about your subscription? Contact our support team at{' '}
            <a href="mailto:support@success.com">support@success.com</a>
          </p>
        </div>
      </div>
    </>
  );
}
