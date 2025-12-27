import Link from 'next/link';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from '../styles/Error.module.css';

export default function Custom404() {
  return (
    <Layout>
      <SEO
        title="Page Not Found | SUCCESS"
        description="The page you're looking for doesn't exist."
        url="https://www.success.com/404"
      />
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1 className={styles.errorCode}>404</h1>
          <h2 className={styles.errorTitle}>Page Not Found</h2>
          <p className={styles.errorMessage}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className={styles.errorActions}>
            <Link href="/" className={styles.primaryButton}>
              Go to Homepage
            </Link>
            <Link href="/search" className={styles.secondaryButton}>
              Search for Content
            </Link>
          </div>
          <div className={styles.helpfulLinks}>
            <h3>Popular Pages:</h3>
            <ul>
              <li><Link href="/magazine">SUCCESS Magazine</Link></li>
              <li><Link href="/success-plus">SUCCESS+</Link></li>
              <li><Link href="/coaching">Coaching</Link></li>
              <li><Link href="/store">Store</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
