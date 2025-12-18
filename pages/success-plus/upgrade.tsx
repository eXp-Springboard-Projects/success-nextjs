import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from './upgrade.module.css';

interface TrialStatus {
  isTrialActive: boolean;
  daysRemaining: number;
  trialEndsAt: string | null;
}

export default function UpgradePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/success-plus/upgrade');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTrialStatus();
    }
  }, [session]);

  async function fetchTrialStatus() {
    try {
      const res = await fetch('/api/user/trial-status');
      if (res.ok) {
        const data = await res.json();
        setTrialStatus(data);
      }
    } catch (err) {
    }
  }

  async function handleUpgrade(plan: 'monthly' | 'yearly') {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
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

  return (
    <>
      <Head>
        <title>Upgrade to SUCCESS+ | SUCCESS Magazine</title>
        <meta name="description" content="Unlock unlimited access to premium content, resources, and tools" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Unlock Your Full Potential</h1>
          <p className={styles.subtitle}>
            {trialStatus?.isTrialActive
              ? `You have ${trialStatus.daysRemaining} days remaining in your free trial`
              : 'Subscribe to SUCCESS+ for unlimited access to premium content'}
          </p>
        </div>

        {error && (
          <div className={styles.error}>
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.plans}>
          {/* Annual Plan - Featured */}
          <div className={`${styles.plan} ${styles.featured}`}>
            <div className={styles.badge}>BEST VALUE</div>
            <h2>Annual</h2>
            <div className={styles.price}>
              <span className={styles.amount}>$79.99</span>
              <span className={styles.period}>/year</span>
            </div>
            <p className={styles.savings}>Save $15.89 compared to monthly</p>
            <ul className={styles.features}>
              <li>✓ Unlimited access to all premium articles</li>
              <li>✓ Exclusive video content</li>
              <li>✓ Downloadable resources & templates</li>
              <li>✓ SUCCESS Labs & courses</li>
              <li>✓ Ad-free reading experience</li>
              <li>✓ Priority support</li>
              {trialStatus?.isTrialActive && (
                <li className={styles.trialBonus}>
                  ✓ Keep your {trialStatus.daysRemaining} remaining trial days
                </li>
              )}
            </ul>
            <button
              onClick={() => handleUpgrade('yearly')}
              disabled={loading}
              className={styles.upgradeButton}
            >
              {loading ? 'Processing...' : 'Subscribe Annually'}
            </button>
            <p className={styles.terms}>Billed $79.99 annually</p>
          </div>

          {/* Monthly Plan */}
          <div className={styles.plan}>
            <h2>Monthly</h2>
            <div className={styles.price}>
              <span className={styles.amount}>$7.99</span>
              <span className={styles.period}>/month</span>
            </div>
            <p className={styles.flexibility}>Cancel anytime</p>
            <ul className={styles.features}>
              <li>✓ Unlimited access to all premium articles</li>
              <li>✓ Exclusive video content</li>
              <li>✓ Downloadable resources & templates</li>
              <li>✓ SUCCESS Labs & courses</li>
              <li>✓ Ad-free reading experience</li>
              <li>✓ Priority support</li>
              {trialStatus?.isTrialActive && (
                <li className={styles.trialBonus}>
                  ✓ Keep your {trialStatus.daysRemaining} remaining trial days
                </li>
              )}
            </ul>
            <button
              onClick={() => handleUpgrade('monthly')}
              disabled={loading}
              className={`${styles.upgradeButton} ${styles.secondary}`}
            >
              {loading ? 'Processing...' : 'Subscribe Monthly'}
            </button>
            <p className={styles.terms}>Billed $7.99 monthly</p>
          </div>
        </div>

        <div className={styles.guarantee}>
          <h3>💯 Money-Back Guarantee</h3>
          <p>
            Not satisfied? Cancel anytime within 30 days for a full refund.
            No questions asked.
          </p>
        </div>

        <div className={styles.faq}>
          <h3>Frequently Asked Questions</h3>
          <div className={styles.faqItem}>
            <h4>Can I cancel anytime?</h4>
            <p>
              Yes! You can cancel your subscription at any time through your
              account settings. You'll continue to have access until the end
              of your billing period.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h4>What happens to my trial?</h4>
            <p>
              If you're currently on a free trial, your remaining trial days
              will be added to your subscription. You won't be charged until
              after your trial ends.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h4>What payment methods do you accept?</h4>
            <p>
              We accept all major credit cards (Visa, Mastercard, American
              Express, Discover) through our secure payment processor, Stripe.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
