import Link from 'next/link';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Error.module.css';

export default function Custom500() {
  return (
    <Layout>
      <SEO
        title="Server Error | SUCCESS"
        description="Something went wrong on our end."
        url="https://www.success.com/500"
      />
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1 className={styles.errorCode}>500</h1>
          <h2 className={styles.errorTitle}>Server Error</h2>
          <p className={styles.errorMessage}>
            Something went wrong on our end. We're working to fix it.
          </p>
          <div className={styles.errorActions}>
            <Link href="/" className={styles.primaryButton}>
              Go to Homepage
            </Link>
            <Link href="/contact" className={styles.secondaryButton}>
              Contact Support
            </Link>
          </div>
          <div className={styles.helpfulLinks}>
            <h3>What you can do:</h3>
            <ul>
              <li>Refresh the page in a few moments</li>
              <li>Clear your browser cache and try again</li>
              <li>Contact our support team if the issue persists</li>
              <li>Visit our <Link href="/help">Help Center</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
