import { useState } from 'react';
import Layout from '../components/Layout';
import styles from './Newsletter.module.css';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  };

  return (
    <Layout>
      <div className={styles.newsletter}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>SUCCESS Newsletter</h1>
            <p className={styles.heroSubtitle}>
              Get weekly insights delivered to your inbox
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.content}>
              <div className={styles.info}>
                <h2 className={styles.infoTitle}>Why Subscribe?</h2>
                <ul className={styles.benefits}>
                  <li>✓ Weekly curated content from industry leaders</li>
                  <li>✓ Exclusive articles not available on the website</li>
                  <li>✓ Early access to magazine features</li>
                  <li>✓ Success tips and actionable strategies</li>
                  <li>✓ Member-only discounts and offers</li>
                </ul>
              </div>

              <div className={styles.formWrapper}>
                {subscribed ? (
                  <div className={styles.success}>
                    <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3>You're In!</h3>
                    <p>Welcome to the SUCCESS community. Check your inbox for a confirmation email.</p>
                  </div>
                ) : (
                  <>
                    <h3 className={styles.formTitle}>Join 100,000+ Subscribers</h3>
                    <form onSubmit={handleSubmit} className={styles.form}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        className={styles.input}
                      />
                      <button type="submit" className={styles.button}>
                        Subscribe Free
                      </button>
                    </form>
                    <p className={styles.privacy}>
                      We respect your privacy. Unsubscribe anytime.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Force SSR to prevent build errors on AWS Amplify
export async function getServerSideProps() {
  return {
    props: {},
  };
}
