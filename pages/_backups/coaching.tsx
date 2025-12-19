import Layout from '../components/Layout';
import Head from 'next/head';
import styles from '../styles/Coaching.module.css';

export default function CoachingPage() {
  return (
    <Layout>
      <Head>
        <title>SUCCESS Coaching - Transform Your Life</title>
        <meta name="description" content="Join our exclusive coaching webinar and discover strategies for success" />
      </Head>

      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>SUCCESS Coaching</h1>
          <p className={styles.subtitle}>Transform Your Life with Expert Guidance</p>
        </div>

        <div className={styles.content}>
          <div className={styles.webinarSection}>
            <h2 className={styles.sectionTitle}>Join Our Exclusive Webinar</h2>
            <p className={styles.webinarText}>
              Discover proven strategies and insights from SUCCESS Magazine's expert coaches. Reserve your spot in our upcoming live webinar and start transforming your goals into achievements.
            </p>
            <a
              href="https://event.webinarjam.com/g8o7wz/register/209gz6sl"
              className={styles.registerButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register for Free Webinar
            </a>
          </div>

          <div className={styles.ctaSection}>
            <h3 className={styles.ctaTitle}>Ready to Take Your Success to the Next Level?</h3>
            <p className={styles.ctaText}>
              Discover our full coaching programs, personalized mentorship, and exclusive resources designed to help you achieve your goals.
            </p>
            <a
              href="https://coaching.success.com"
              className={styles.learnMoreButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More About SUCCESS Coaching
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
