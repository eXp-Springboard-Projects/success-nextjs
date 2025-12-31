import { useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import styles from './SuccessPlus.module.css';

export default function SuccessPlusPage() {
  return (
    <Layout>
      <div className={styles.successPlus}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              128 Years of SUCCESS<sup>®</sup> —<br />
              <span className={styles.heroAccent}>Reimagined for What's Next</span>
            </h1>
            <p className={styles.heroSubtitle}>
              For more than a century, SUCCESS<sup>®</sup> has been the source of wisdom for those building meaningful lives and lasting impact. With <strong>SUCCESS+™</strong>, that tradition continues—uniting print and digital experiences to bring you closer to the ideas, people, and insights shaping success today.
            </p>
            <Link href="/signup/trial" className={styles.heroCTA}>
              Start Your Free Trial
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Your SUCCESS+ Insider Membership Includes</h2>
            <p className={styles.sectionSubtitle}>Unlock the full depth of what SUCCESS<sup>®</sup> represents.</p>

            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIconBlue}>📰</div>
                <h3 className={styles.featureTitle}>Six Print Issues a Year</h3>
                <p className={styles.featureDescription}>
                  The magazine that's shaped modern personal development—delivered to your door every other month. Each SUCCESS<sup>®</sup> magazine print issue dives deep into leadership, mindset, wealth, and well-being with stories and strategies you can put into action.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconBlue}>📱</div>
                <h3 className={styles.featureTitle}>Six Digital Editions</h3>
                <p className={styles.featureDescription}>
                  Enjoy every issue of SUCCESS<sup>®</sup> Digital Edition on your favorite device. Read, highlight, and revisit the ideas that move you—wherever you are. Your membership also includes digital access to recent print issues.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconYellow}>⭐</div>
                <h3 className={styles.featureTitle}>Exclusive Access to Features</h3>
                <p className={styles.featureDescription}>
                  Go beyond the headlines with deeper access to cover stories, interviews, and features from thought leaders and innovators such as Mel Robbins, Tony Robbins, Daymond John, and many more! Available only to members.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconRed}>🔧</div>
                <h3 className={styles.featureTitle}>Practical Resources for Real Progress</h3>
                <p className={styles.featureDescription}>
                  Alongside your magazine access, your membership includes exclusive access to a growing library of on-demand courses and micro-courses as well as downloadable guides, e-books, and worksheets created by the SUCCESS® editorial and coaching teams—tools designed to help you apply what you read. Plus, don't miss the discounts on premium SUCCESS® programs also included.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconGreen}>👥</div>
                <h3 className={styles.featureTitle}>Insider Perspective from Leadership</h3>
                <p className={styles.featureDescription}>
                  Stay connected with members-only newsletters and insights. Their expert commentary connects the dots between timeless SUCCESS<sup>®</sup> principles and today's evolving world — and keeps you in the know on where the brand is headed next.
                </p>
                <div className={styles.leadershipList}>
                  <p><strong>Glenn Sanford</strong> – Managing Director & Publisher</p>
                  <p><strong>Kerrie Lee Brown</strong> – Chief Content Officer & Editor-in-Chief</p>
                  <p><strong>Courtland Warren</strong> – Founding Faculty & Program Lead, SUCCESS Coaching™</p>
                  <p><strong>Rachel Nead</strong> – Vice President of Innovations</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={styles.pricingSection}>
          <div className={styles.container}>
            <h2 className={styles.pricingSectionTitle}>Join the Movement of Modern Achievers</h2>
            <p className={styles.pricingSubtitle}>
              Receive print and digital issues, member-only resources, and the full depth of what SUCCESS<sup>®</sup> represents—legacy insight for today's bold leaders.
            </p>

            <div className={styles.pricingCard}>
              <h3 className={styles.pricingCardTitle}>Start your 14-day free trial today.</h3>
              <p className={styles.pricingCardSubtitle}>Choose your plan below. Cancel anytime.</p>

              <div className={styles.plansGrid}>
                <div className={styles.planCard}>
                  <h4 className={styles.planName}>Monthly Plan</h4>
                  <div className={styles.planPrice}>
                    <span className={styles.amount}>$7.99</span>
                    <span className={styles.period}>/mo</span>
                  </div>
                  <p className={styles.planNote}>After 14-day trial</p>
                  <Link href="/signup/trial?plan=monthly" className={styles.planButtonDark}>
                    Start Monthly Trial
                  </Link>
                </div>

                <div className={`${styles.planCard} ${styles.planCardFeatured}`}>
                  <span className={styles.bestValue}>BEST VALUE</span>
                  <h4 className={styles.planName}>Annual Plan</h4>
                  <div className={styles.planPrice}>
                    <span className={styles.amountBlue}>$75</span>
                    <span className={styles.period}>/year</span>
                  </div>
                  <p className={styles.planNote}>After 14-day trial</p>
                  <Link href="/signup/trial?plan=annual" className={styles.planButtonBlue}>
                    Start Annual Trial
                  </Link>
                </div>
              </div>

              <p className={styles.nextChapter}>Your next chapter of growth starts here.</p>
            </div>
          </div>
        </section>

        {/* Why SUCCESS+ Section */}
        <section className={styles.whySection}>
          <div className={styles.container}>
            <div className={styles.whyGrid}>
              <div className={styles.whyImage}>
                <img src="/images/success-magazine-lewis-howes.jpg" alt="SUCCESS Magazine on tablet" />
              </div>
              <div className={styles.whyContent}>
                <h2 className={styles.whyTitle}>Why SUCCESS+?</h2>
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
            </div>
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
