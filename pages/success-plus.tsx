import { useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import styles from './SuccessPlus.module.css';

export default function SuccessPlusPage() {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  return (
    <Layout>
      <div className={styles.successPlus}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              128 Years of SUCCESS® — Reimagined for What's Next
            </h1>
            <p className={styles.heroSubtitle}>
              For more than a century, SUCCESS® has been the source of wisdom for those building meaningful lives and lasting impact.
            </p>
            <p className={styles.heroDescription}>
              With SUCCESS+™, that tradition continues—uniting print and digital experiences to bring you closer to the ideas, people, and insights shaping success today.
            </p>
            <Link href="/signup/trial" className={styles.heroCTA}>
              Start Your Free Trial
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Your SUCCESS+ Insider Membership Includes</h2>

            <div className={styles.features}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>📰</div>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>Six Print Issues a Year</h3>
                  <p className={styles.featureDescription}>
                    The magazine that's shaped modern personal development—delivered to your door every other month. Each SUCCESS® magazine print issue dives deep into leadership, mindset, wealth, and well-being with stories and strategies you can put into action.
                  </p>
                </div>
              </div>

              <div className={styles.feature}>
                <div className={styles.featureIcon}>📱</div>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>Six Digital Editions</h3>
                  <p className={styles.featureDescription}>
                    Enjoy every issue of SUCCESS® Digital Edition on your favorite device. Read, highlight, and revisit the ideas that move you—wherever you are. Your membership also includes digital access to recent print issues.
                  </p>
                </div>
              </div>

              <div className={styles.feature}>
                <div className={styles.featureIcon}>🌟</div>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>Exclusive Access to SUCCESS® Magazine Features</h3>
                  <p className={styles.featureDescription}>
                    SUCCESS+ gives you the full experience of the magazine. You'll go beyond the headlines with deeper access to cover stories, interviews, and features from thought leaders and innovators such as <strong>Mel Robbins, Tony Robbins, Daymond John, and many more!</strong>
                  </p>
                  <p className={styles.featureDescription}>
                    These exclusive interviews and in-depth pieces live outside the magazine—available only to members.
                  </p>
                </div>
              </div>

              <div className={styles.feature}>
                <div className={styles.featureIcon}>📚</div>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>Practical Resources for Real Progress</h3>
                  <p className={styles.featureDescription}>
                    Alongside your magazine access, your membership includes exclusive downloadable guides, e-books, and worksheets created by the SUCCESS® editorial and coaching teams—tools designed to help you apply what you read.
                  </p>
                  <p className={styles.featureDescription}>
                    You'll also find a growing library of on-demand courses and micro-courses, as well as exclusive discounts on premium SUCCESS® programs.
                  </p>
                </div>
              </div>

              <div className={styles.feature}>
                <div className={styles.featureIcon}>✉️</div>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>Insider Perspective from the SUCCESS Leadership Team</h3>
                  <p className={styles.featureDescription}>
                    Stay connected with members-only newsletters and insights from:
                  </p>
                  <ul className={styles.leadershipList}>
                    <li><strong>Glenn Sanford</strong> – Managing Director & Publisher</li>
                    <li><strong>Kerrie Lee Brown</strong> – Chief Content Officer & Editor-in-Chief</li>
                    <li><strong>Courtland Warren</strong> – Founding Faculty & Program Lead, SUCCESS Coaching™</li>
                    <li><strong>Rachel Nead</strong> – Vice President of Innovations</li>
                  </ul>
                  <p className={styles.featureDescription}>
                    Receive four newsletters per month with expert commentary that connects timeless SUCCESS® principles to today's evolving world — and keeps you in the know on where the brand is headed next.
                  </p>
                </div>
              </div>

              <div className={styles.feature}>
                <div className={styles.featureIcon}>🎥</div>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>Legacy Material — Brought to the Forefront</h3>
                  <p className={styles.featureDescription}>
                    Access historic SUCCESS® content and video training that has stood the test of time. Learn from decades of proven wisdom and success strategies that continue to shape modern achievement.
                  </p>
                </div>
              </div>

              <div className={styles.feature}>
                <div className={styles.featureIcon}>🧪</div>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>SUCCESS Labs — AI-Powered Coaching Community</h3>
                  <p className={styles.featureDescription}>
                    Get exclusive access to <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer" style={{color: '#c41e3a', textDecoration: 'underline'}}>SUCCESS Labs</a>, our AI-powered coaching platform and community of high achievers. Connect with like-minded individuals, get personalized guidance, and accelerate your path to success.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why SUCCESS+ Section */}
        <section className={styles.whySection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Why SUCCESS+</h2>
            <p className={styles.whyText}>
              The world moves faster than ever before—but wisdom still matters.
            </p>
            <p className={styles.whyText}>
              SUCCESS+ bridges that gap. It's where heritage meets progress: the magazine that built the personal development movement, now expanded for the digital age.
            </p>
            <p className={styles.whyText}>
              You'll stay inspired by exclusive content, grounded by trusted voices, and equipped with practical tools that help you grow with focus and purpose.
            </p>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={styles.plansSection} id="plans">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Join the Movement of Modern Achievers</h2>
            <p className={styles.pricingSubtitle}>Start your 14-day free trial today.</p>

            <div className={styles.billingToggle}>
              <button
                className={billingCycle === 'monthly' ? styles.active : ''}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={billingCycle === 'annual' ? styles.active : ''}
                onClick={() => setBillingCycle('annual')}
              >
                Annual <span className={styles.saveBadge}>Save 22%</span>
              </button>
            </div>

            <div className={styles.pricingCard}>
              {billingCycle === 'annual' ? (
                <>
                  <div className={styles.price}>
                    <span className={styles.amount}>$75</span>
                    <span className={styles.period}>/year</span>
                  </div>
                  <p className={styles.savings}>Save over $20 compared to monthly!</p>
                </>
              ) : (
                <>
                  <div className={styles.price}>
                    <span className={styles.amount}>$7.99</span>
                    <span className={styles.period}>/month</span>
                  </div>
                  <p className={styles.savings}>Billed monthly ($95.88/year)</p>
                </>
              )}
              <p className={styles.cancellation}>Cancel anytime.</p>
              <ul className={styles.pricingFeatures}>
                <li>✓ Six Print Issues & Six Digital Editions a year</li>
                <li>✓ Digital access to each print issue</li>
                <li>✓ Exclusive interviews with cover talent</li>
                <li>✓ On-demand courses (member discounts available)</li>
                <li>✓ Downloadable e-books, guides, and worksheets</li>
                <li>✓ Insider Newsletters (4 per month from leadership)</li>
                <li>✓ Legacy video training and historic content</li>
                <li>✓ Additional member discounts on premium programs</li>
              </ul>
              <Link
                href="/signup/trial"
                className={styles.joinButton}
              >
                Start Your Free Trial Today
              </Link>
            </div>

            <p className={styles.tagline}>
              Receive print and digital issues, member-only resources, and the full depth of what SUCCESS® represents—<strong>legacy insight for modern achievement.</strong>
            </p>
            <p className={styles.finalCta}>Your next chapter of growth starts here.</p>
          </div>
        </section>

        {/* Footer Tagline */}
        <section className={styles.footerTagline}>
          <div className={styles.container}>
            <h2 className={styles.brandTitle}>SUCCESS+</h2>
            <p className={styles.brandSubtitle}>Built on Legacy. Designed for the Digital Age.</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Force SSR for AWS Amplify deployment compatibility
export async function getServerSideProps() {
  return {
    props: {},
  };
}
