import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from './Paywall.module.css';
import { getTierBenefits, getTierPricing } from '../lib/access-control';

interface PaywallProps {
  requiredTier?: 'collective' | 'insider';
  articleTitle?: string;
  excerpt?: string;
}

export default function Paywall({ requiredTier = 'collective', articleTitle, excerpt }: PaywallProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleUpgrade = (tier: 'collective' | 'insider', billingCycle: 'monthly' | 'annual') => {
    router.push('/subscriptions');
  };

  const handleLogin = () => {
    router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
  };

  return (
    <div className={styles.paywall}>
      {/* Article Preview */}
      {excerpt && (
        <div className={styles.preview}>
          {articleTitle && <h1 className={styles.previewTitle}>{articleTitle}</h1>}
          <div className={styles.previewContent}>
            <div dangerouslySetInnerHTML={{ __html: excerpt }} />
            <div className={styles.fade}></div>
          </div>
        </div>
      )}

      {/* Paywall Message */}
      <div className={styles.paywallContent}>
        <div className={styles.lockIcon}>🔒</div>
        <h2 className={styles.title}>
          {requiredTier === 'insider'
            ? 'Insider Members Only'
            : 'Premium Content'}
        </h2>
        <p className={styles.subtitle}>
          {requiredTier === 'insider'
            ? 'This exclusive content is available only to SUCCESS+ Insider members.'
            : 'Upgrade to SUCCESS+ to unlock unlimited access to premium articles, videos, and more.'}
        </p>

        {!session && (
          <div className={styles.loginPrompt}>
            <p>Already a member?</p>
            <button onClick={handleLogin} className={styles.loginButton}>
              Sign In
            </button>
          </div>
        )}

        {/* Pricing Cards */}
        <div className={styles.pricingCards}>
          {/* Collective Tier */}
          <div className={`${styles.pricingCard} ${requiredTier === 'collective' ? styles.recommended : ''}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Collective</h3>
              {requiredTier === 'collective' && (
                <span className={styles.recommendedBadge}>Recommended</span>
              )}
            </div>

            <div className={styles.pricing}>
              <span className={styles.price}>${getTierPricing('collective', 'annual')}</span>
              <span className={styles.period}>/year</span>
            </div>
            <p className={styles.savingsText}>Save $20 with annual billing</p>
            <p className={styles.monthlyPrice}>or $9.99/month</p>

            <ul className={styles.benefits}>
              {getTierBenefits('collective').map((benefit, index) => (
                <li key={index}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade('collective', 'annual')}
              className={`${styles.upgradeButton} ${requiredTier === 'collective' ? styles.primary : ''}`}
            >
              Start Collective
            </button>
            <button
              onClick={() => handleUpgrade('collective', 'monthly')}
              className={styles.monthlyButton}
            >
              Choose Monthly
            </button>
          </div>

          {/* Insider Tier */}
          <div className={`${styles.pricingCard} ${styles.insiderCard} ${requiredTier === 'insider' ? styles.recommended : ''}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Insider</h3>
              {requiredTier === 'insider' && (
                <span className={styles.recommendedBadge}>Required</span>
              )}
              <span className={styles.popularBadge}>Most Popular</span>
            </div>

            <div className={styles.pricing}>
              <span className={styles.price}>${getTierPricing('insider', 'annual')}</span>
              <span className={styles.period}>/year</span>
            </div>
            <p className={styles.savingsText}>Save $30 with annual billing</p>
            <p className={styles.monthlyPrice}>or $14.99/month</p>

            <ul className={styles.benefits}>
              {getTierBenefits('insider').map((benefit, index) => (
                <li key={index}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade('insider', 'annual')}
              className={`${styles.upgradeButton} ${styles.primary}`}
            >
              Start Insider
            </button>
            <button
              onClick={() => handleUpgrade('insider', 'monthly')}
              className={styles.monthlyButton}
            >
              Choose Monthly
            </button>
          </div>
        </div>

        {/* Trust Signals */}
        <div className={styles.trustSignals}>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>✓</span>
            <span>Cancel anytime</span>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>✓</span>
            <span>30-day money-back guarantee</span>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>✓</span>
            <span>Instant access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
