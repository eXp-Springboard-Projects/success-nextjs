import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './upgrade.module.css';

export default function UpgradePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const { expired } = router.query;

  const plans = {
    monthly: {
      price: 19.99,
      period: 'month',
      savings: null,
    },
    annual: {
      price: 199.99,
      period: 'year',
      savings: '17%',
      monthlyEquivalent: 16.67,
    },
  };

  const handleUpgrade = async () => {
    // TODO: Integrate with Stripe
    alert('Payment integration coming soon! This will redirect to Stripe checkout.');
  };

  return (
    <>
      <Head>
        <title>Upgrade to SUCCESS+ - Continue Your Journey</title>
        <meta
          name="description"
          content="Upgrade to SUCCESS+ for unlimited access to premium content, courses, and exclusive resources."
        />
      </Head>

      <div className={styles.container}>
        <div className={styles.upgradeBox}>
          {/* Header */}
          <div className={styles.header}>
            <Link href="/dashboard" className={styles.backLink}>
              ← Back to Dashboard
            </Link>

            {expired && (
              <div className={styles.expiredNotice}>
                <span className={styles.expiredIcon}>⏰</span>
                <div>
                  <h3>Your Trial Has Ended</h3>
                  <p>Upgrade now to continue accessing premium content and resources</p>
                </div>
              </div>
            )}

            <div className={styles.logo}>
              <img src="/success-logo.png" alt="SUCCESS" />
            </div>

            <h1 className={styles.title}>Unlock Your Full Potential</h1>
            <p className={styles.subtitle}>
              Join 50,000+ members accessing premium SUCCESS+ content
            </p>
          </div>

          {/* Plan Toggle */}
          <div className={styles.planToggle}>
            <button
              className={selectedPlan === 'monthly' ? styles.toggleActive : ''}
              onClick={() => setSelectedPlan('monthly')}
            >
              Monthly
            </button>
            <button
              className={selectedPlan === 'annual' ? styles.toggleActive : ''}
              onClick={() => setSelectedPlan('annual')}
            >
              Annual
              <span className={styles.savingsBadge}>Save 17%</span>
            </button>
          </div>

          {/* Pricing Card */}
          <div className={styles.pricingCard}>
            <div className={styles.priceDisplay}>
              <span className={styles.currency}>$</span>
              <span className={styles.amount}>
                {selectedPlan === 'annual' ? plans.annual.price : plans.monthly.price}
              </span>
              <span className={styles.period}>/{plans[selectedPlan].period}</span>
            </div>

            {selectedPlan === 'annual' && (
              <p className={styles.monthlyEquivalent}>
                Just ${plans.annual.monthlyEquivalent}/month when billed annually
              </p>
            )}

            <button className={styles.upgradeButton} onClick={handleUpgrade}>
              Upgrade to SUCCESS+
            </button>

            <p className={styles.guarantee}>
              30-Day Money-Back Guarantee • Cancel Anytime
            </p>
          </div>

          {/* Features */}
          <div className={styles.features}>
            <h2 className={styles.featuresTitle}>Everything You Get</h2>

            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>📚</span>
                <div className={styles.featureContent}>
                  <h3>Unlimited Premium Articles</h3>
                  <p>Access our complete library of expert insights and success strategies</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🎓</span>
                <div className={styles.featureContent}>
                  <h3>Exclusive Courses</h3>
                  <p>Learn from world-class experts with step-by-step video courses</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>📖</span>
                <div className={styles.featureContent}>
                  <h3>Digital Magazine Archive</h3>
                  <p>Download every issue of SUCCESS Magazine in digital format</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🔬</span>
                <div className={styles.featureContent}>
                  <h3>SUCCESS Labs</h3>
                  <p>Interactive tools and resources to implement what you learn</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🎥</span>
                <div className={styles.featureContent}>
                  <h3>Video Library</h3>
                  <p>Exclusive interviews, documentaries, and masterclasses</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>📅</span>
                <div className={styles.featureContent}>
                  <h3>Live Events & Webinars</h3>
                  <p>Join live Q&As and workshops with SUCCESS experts</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🎙️</span>
                <div className={styles.featureContent}>
                  <h3>Podcast Archive</h3>
                  <p>Ad-free access to all SUCCESS podcast episodes</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🌟</span>
                <div className={styles.featureContent}>
                  <h3>Priority Support</h3>
                  <p>Get help from our team whenever you need it</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className={styles.testimonials}>
            <div className={styles.testimonial}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.testimonialText}>
                "SUCCESS+ has been a game-changer for my business. The premium content
                and courses are worth every penny."
              </p>
              <div className={styles.testimonialAuthor}>
                <strong>Michael Chen</strong>
                <span>Entrepreneur</span>
              </div>
            </div>

            <div className={styles.testimonial}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.testimonialText}>
                "I've tried other platforms, but SUCCESS+ delivers the highest quality
                content and actionable strategies."
              </p>
              <div className={styles.testimonialAuthor}>
                <strong>Jessica Williams</strong>
                <span>Business Coach</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <p>
              Have questions? <Link href="/contact">Contact our team</Link>
            </p>
            <p className={styles.secure}>
              🔒 Secure payment processing via Stripe
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
