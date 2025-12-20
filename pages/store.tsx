import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from './Store.module.css';

export default function StorePage() {
  return (
    <Layout>
      <SEO
        title="SUCCESS Store | Books, Merchandise & More"
        description="Shop SUCCESS Magazine merchandise, bestselling books, and exclusive products for personal and professional growth."
        url="https://www.success.com/store"
        type="website"
      />

      <div className={styles.store}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>SUCCESS Store</h1>
            <p className={styles.heroSubtitle}>
              Tools and Resources for Your Success Journey
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.comingSoon}>
              <svg
                className={styles.icon}
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>

              <h2 className={styles.comingSoonTitle}>Store Coming Soon</h2>
              <p className={styles.comingSoonText}>
                We're working on bringing you an amazing shopping experience with curated products,
                books, and resources to fuel your success journey.
              </p>

              <div className={styles.features}>
                <div className={styles.feature}>
                  <h3>📚 Bestselling Books</h3>
                  <p>Curated selection of personal development and business books</p>
                </div>
                <div className={styles.feature}>
                  <h3>🎁 Exclusive Merchandise</h3>
                  <p>SUCCESS Magazine branded products and accessories</p>
                </div>
                <div className={styles.feature}>
                  <h3>📖 Digital Resources</h3>
                  <p>Guides, templates, and tools for your growth</p>
                </div>
              </div>

              <div className={styles.cta}>
                <p className={styles.ctaText}>
                  Want to be notified when we launch?
                </p>
                <a href="/newsletter" className={styles.ctaButton}>
                  Subscribe to Our Newsletter
                </a>
              </div>
            </div>

            {/* Temporary External Link */}
            <div className={styles.alternate}>
              <p className={styles.alternateText}>
                In the meantime, check out our recommended resources:
              </p>
              <div className={styles.links}>
                <a
                  href="https://www.success.com/category/books"
                  className={styles.link}
                >
                  Book Reviews & Recommendations
                </a>
                <a
                  href="/magazine"
                  className={styles.link}
                >
                  SUCCESS Magazine
                </a>
                <a
                  href="/success-plus"
                  className={styles.link}
                >
                  SUCCESS+ Membership
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  return {
    props: {}
  };
}
