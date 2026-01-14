import Layout from '../../../components/Layout';
import SEO from '../../../components/SEO';
import Link from 'next/link';
import styles from './checkout.module.css';

export default function CheckoutCancel() {
  return (
    <Layout>
      <SEO
        title="Checkout Cancelled | SUCCESS Store"
        description="Your checkout was cancelled"
      />

      <div className={styles.checkoutPage}>
        <div className={styles.cancelContainer}>
          <div className={styles.cancelIcon}>✕</div>
          <h1>Checkout Cancelled</h1>
          <p className={styles.subtitle}>
            Your order was not completed. No charges have been made.
          </p>

          <div className={styles.helpText}>
            <h3>Need Help?</h3>
            <p>
              If you experienced any issues during checkout, please{' '}
              <Link href="/contact">contact our support team</Link>.
            </p>
            <p>
              We're here to help! You can also check out our{' '}
              <Link href="/help">FAQ page</Link> for common questions.
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/store" className={styles.primaryButton}>
              Return to Store
            </Link>
            <Link href="/" className={styles.secondaryButton}>
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
