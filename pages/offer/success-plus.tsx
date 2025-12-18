import { useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import styles from './success-plus.module.css';

export default function SuccessPlusOffer() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const handleCheckout = async (tier: 'collective' | 'insider', cycle: 'monthly' | 'annual') => {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          billingCycle: cycle,
          successUrl: `${window.location.origin}/success-plus/welcome`,
          cancelUrl: window.location.href,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      alert('There was an error processing your request. Please try again.');
    }
  };

  return (
    <Layout>
      <Head>
        <title>SUCCESS+ Membership - Unlock Your Full Potential</title>
        <meta name="description" content="Join SUCCESS+ for exclusive magazine access, member-only resources, and insider content. Only $7.99/month." />
      </Head>

      <div className={styles.successPlusPage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>128 Years of SUCCESS® — Reimagined for What's Next</h1>
            <p className={styles.heroSubtitle}>
              For more than a century, SUCCESS® has been the source of wisdom for those building meaningful lives and lasting impact.
            </p>
            <p className={styles.heroSubtitle}>
              With SUCCESS+™, that tradition continues—uniting print and digital experiences to bring you closer to the ideas, people, and insights shaping success today.
            </p>
            <a
              href="/signup/trial"
              className={styles.ctaPrimary}
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              Start Your Free Trial
            </a>
          </div>
        </section>

        {/* What's Included */}
        <section className={styles.whatsIncluded}>
          <h2>Your SUCCESS+ Insider Membership Includes</h2>

          <div className={styles.benefitsGrid}>
            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>📰</div>
              <h3>Six Print Issues a Year</h3>
              <p>The magazine that's shaped modern personal development—delivered to your door every other month. Each SUCCESS® magazine print issue dives deep into leadership, mindset, wealth, and well-being with stories and strategies you can put into action.</p>
            </div>

            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>📱</div>
              <h3>Six Digital Editions</h3>
              <p>Enjoy every issue of SUCCESS® Digital Edition on your favorite device. Read, highlight, and revisit the ideas that move you—wherever you are. Your membership also includes digital access to recent print issues.</p>
            </div>

            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>🌟</div>
              <h3>Exclusive Access to SUCCESS® Magazine Features</h3>
              <p>SUCCESS+ gives you the full experience of the magazine. You'll go beyond the headlines with deeper access to cover stories, interviews, and features from thought leaders and innovators such as <strong>Mel Robbins, Tony Robbins, Daymond John, and many more!</strong></p>
              <p>These exclusive interviews and in-depth pieces live outside the magazine—available only to members.</p>
            </div>

            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>📚</div>
              <h3>Practical Resources for Real Progress</h3>
              <p>Alongside your magazine access, your membership includes exclusive downloadable guides, e-books, and worksheets created by the SUCCESS® editorial and coaching teams—tools designed to help you apply what you read.</p>
              <p>You'll also find a growing library of on-demand courses and micro-courses, as well as exclusive discounts on premium SUCCESS® programs.</p>
            </div>

            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>✉️</div>
              <h3>Insider Perspective from the SUCCESS Leadership Team</h3>
              <p>Stay connected with members-only newsletters and insights from Glenn Sanford, Kerrie Lee Brown, Courtland Warren, and Rachel Nead—four newsletters per month with expert commentary that connects timeless SUCCESS® principles to today's evolving world.</p>
            </div>

            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>🎥</div>
              <h3>Legacy Material — Brought to the Forefront</h3>
              <p>Access historic SUCCESS® content and video training that has stood the test of time. Learn from decades of proven wisdom and success strategies.</p>
            </div>
          </div>
        </section>

        {/* Does This Sound Like You */}
        <section className={styles.audience}>
          <h2>Does This Sound Like You?</h2>
          <div className={styles.audienceGrid}>
            <div className={styles.audienceCard}>
              <h4>Aspiring Entrepreneur</h4>
              <p>You want to start your own business but need the knowledge and confidence to take the leap.</p>
            </div>
            <div className={styles.audienceCard}>
              <h4>Career Climber</h4>
              <p>You're ready to level up in your career and need the skills to stand out.</p>
            </div>
            <div className={styles.audienceCard}>
              <h4>Side Hustler</h4>
              <p>You want to build additional income streams while keeping your day job.</p>
            </div>
            <div className={styles.audienceCard}>
              <h4>Business Owner</h4>
              <p>You're growing your business and need strategies to scale sustainably.</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className={styles.pricing} id="pricing">
          <h2>Join SUCCESS+ Today</h2>

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
              Annual <span className={styles.saveBadge}>SAVE 22%</span>
            </button>
          </div>

          <div className={styles.pricingGrid}>
            {/* SUCCESS+ Insider - Single Plan */}
            <div className={`${styles.pricingCard} ${styles.featured}`}>
              <div className={styles.pricingHeader}>
                <h3>SUCCESS+ Insider</h3>
              </div>

              <div className={styles.pricingPrice}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>
                  {billingCycle === 'annual' ? '75' : '7.99'}
                </span>
                <span className={styles.period}>
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>

              {billingCycle === 'annual' ? (
                <p className={styles.savings}>Save over $20 compared to monthly!</p>
              ) : (
                <p className={styles.savings}>$95.88/year when billed monthly</p>
              )}

              <ul className={styles.featureList}>
                <li>✓ Six Print Issues & Six Digital Editions a year</li>
                <li>✓ Digital access to each print issue</li>
                <li>✓ Exclusive interviews with cover talent</li>
                <li>✓ On-demand courses (member discounts available)</li>
                <li>✓ Downloadable e-books, guides, and worksheets</li>
                <li>✓ Insider Newsletters (4 per month from leadership)</li>
                <li>✓ Legacy video training and historic content</li>
                <li>✓ Additional member discounts on premium programs</li>
                <li>✓ Cancel anytime</li>
              </ul>

              <a
                href="/signup/trial"
                className={styles.ctaPrimary}
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                Start Your Free Trial
              </a>
            </div>
          </div>
        </section>

        {/* Guarantee Section */}
        <section className={styles.guarantee}>
          <h2>30-Day Risk-Free Guarantee</h2>
          <p>
            Try SUCCESS+ completely risk-free for 30 days. If you're not completely
            satisfied, we'll refund your membership—no questions asked.
          </p>
        </section>

        {/* FAQ */}
        <section className={styles.faq}>
          <h2>Frequently Asked Questions</h2>

          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h4>Can I cancel anytime?</h4>
              <p>Yes, you can cancel your membership at any time. No long-term contracts or commitments.</p>
            </div>

            <div className={styles.faqItem}>
              <h4>What's included in SUCCESS+ Insider?</h4>
              <p>You get print & digital magazine issues, 100+ on-demand courses, exclusive member content, insider newsletters, community access, and much more—all for one low price.</p>
            </div>

            <div className={styles.faqItem}>
              <h4>How often is new content added?</h4>
              <p>We add new courses, articles, and training materials every week to keep you learning and growing.</p>
            </div>

            <div className={styles.faqItem}>
              <h4>Is there a mobile app?</h4>
              <p>Yes! Our iOS and Android apps let you learn on the go. Download courses for offline viewing.</p>
            </div>

            <div className={styles.faqItem}>
              <h4>What if I'm not satisfied?</h4>
              <p>We offer a 30-day money-back guarantee. If SUCCESS+ isn't right for you, we'll refund your purchase.</p>
            </div>

            <div className={styles.faqItem}>
              <h4>Can I upgrade my membership?</h4>
              <p>Absolutely! You can upgrade from Collective to Insider anytime from your account settings.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <h2>Ready to Unlock Your Full Potential?</h2>
          <p>Join thousands of achievers building the skills for success.</p>
          <button
            className={styles.ctaPrimary}
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          >
            GET STARTED NOW
          </button>
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
