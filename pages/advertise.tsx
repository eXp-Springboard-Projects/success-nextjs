import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Link from 'next/link';
import styles from './Advertise.module.css';

export default function AdvertisePage() {
  return (
    <Layout>
      <SEO
        title="Advertise with SUCCESS | Reach Millions of Achievers"
        description="Partner with SUCCESS Magazine to reach our audience of entrepreneurs, business leaders, and professionals seeking growth and success."
        url="https://www.success.com/advertise"
        type="website"
      />

      <div className={styles.advertise}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Advertise with SUCCESS</h1>
            <p className={styles.heroSubtitle}>
              Reach Millions of Entrepreneurs, Leaders & Achievers
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.intro}>
              <h2 className={styles.sectionTitle}>Why SUCCESS?</h2>
              <p className={styles.introText}>
                For over 125 years, SUCCESS has been the trusted guide for millions seeking
                personal and professional growth. Our audience is engaged, ambitious, and ready
                to invest in their success.
              </p>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statNumber}>5M+</div>
                <div className={styles.statLabel}>Monthly Readers</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>125+</div>
                <div className={styles.statLabel}>Years of Trust</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>78%</div>
                <div className={styles.statLabel}>Business Owners</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNumber}>$150K+</div>
                <div className={styles.statLabel}>Avg. Household Income</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.cta}>
              <h2>Ready to Reach Our Audience?</h2>
              <p>Download our media kit or contact our advertising team to get started.</p>

              <div className={styles.ctaButtons}>
                <Link href="/press/media-kit" className={styles.primaryButton}>
                  Download Media Kit
                </Link>
                <Link href="/contact" className={styles.secondaryButton}>
                  Contact Advertising Team
                </Link>
              </div>

              <div className={styles.contactInfo}>
                <p><strong>Advertising Inquiries:</strong></p>
                <p>
                  Email: <a href="mailto:advertising@success.com">advertising@success.com</a>
                </p>
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
