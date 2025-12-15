import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import styles from './welcome.module.css';

export default function SuccessPlusWelcome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionId = router.query.session_id;

        if (sessionId) {
          // Verify the checkout session
          const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
          const data = await response.json();

          if (data.success) {
            setLoading(false);
          } else {
            setError('Unable to verify your subscription. Please contact support.');
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError('An error occurred. Please contact support.');
        setLoading(false);
      }
    };

    if (router.isReady) {
      verifySession();
    }
  }, [router.isReady, router.query.session_id]);

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <h2>Verifying your subscription...</h2>
          <div className={styles.spinner}></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.error}>
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/contact')}>Contact Support</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Welcome to SUCCESS+ - Get Started</title>
      </Head>

      <div className={styles.welcomePage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.checkmark}>✓</div>
            <h1>Welcome to SUCCESS+!</h1>
            <p className={styles.subtitle}>
              You're all set. Let's unlock your full potential together.
            </p>
          </div>
        </section>

        <section className={styles.nextSteps}>
          <h2>What's Next?</h2>

          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Check Your Email</h3>
              <p>
                We've sent you a confirmation email with your login details and
                getting started guide.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Download the App</h3>
              <p>
                Get the SUCCESS+ mobile app to learn on the go. Available on iOS
                and Android.
              </p>
              <div className={styles.appButtons}>
                <a href="#" className={styles.appStore}>App Store</a>
                <a href="#" className={styles.playStore}>Google Play</a>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Explore the Library</h3>
              <p>
                Browse 100+ courses on leadership, entrepreneurship, and personal
                development.
              </p>
              <button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </section>

        <section className={styles.resources}>
          <h2>Recommended First Steps</h2>

          <div className={styles.resourcesGrid}>
            <div className={styles.resource}>
              <h4>🎯 Set Your Goals</h4>
              <p>Define what success means to you and create a personalized learning path.</p>
              <a href="/dashboard/goals">Set Goals →</a>
            </div>

            <div className={styles.resource}>
              <h4>📚 Featured Courses</h4>
              <p>Start with our most popular courses designed for new members.</p>
              <a href="/courses/featured">Browse Courses →</a>
            </div>

            <div className={styles.resource}>
              <h4>👥 Join the Community</h4>
              <p>Connect with thousands of like-minded achievers in our private forum.</p>
              <a href="/community">Join Community →</a>
            </div>

            <div className={styles.resource}>
              <h4>🧪 SUCCESS Labs</h4>
              <p>Get AI-powered coaching and join our exclusive community of high achievers.</p>
              <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer">Visit SUCCESS Labs →</a>
            </div>

            <div className={styles.resource}>
              <h4>📖 This Month's Magazine</h4>
              <p>Read the latest issue featuring exclusive interviews and insights.</p>
              <a href="/magazine">Read Magazine →</a>
            </div>
          </div>
        </section>

        <section className={styles.support}>
          <h2>Need Help Getting Started?</h2>
          <p>
            Our support team is here to help you get the most out of your SUCCESS+ membership.
          </p>
          <div className={styles.supportButtons}>
            <button onClick={() => router.push('/help')}>Visit Help Center</button>
            <button onClick={() => router.push('/contact')} className={styles.secondaryBtn}>
              Contact Support
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Force SSR to prevent NextRouter errors during build
export async function getServerSideProps() {
  return {
    props: {},
  };
}
