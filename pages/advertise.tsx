import Layout from '../components/Layout';
import styles from './Advertise.module.css';
import Head from 'next/head';

export default function AdvertisePage() {
  return (
    <Layout>
      <Head>
        <title>Advertise with SUCCESS Magazine | Reach Ambitious Professionals</title>
        <meta name="description" content="Partner with SUCCESS Magazine to reach millions of ambitious, growth-minded professionals. Multi-platform advertising opportunities for 2025." />
      </Head>

      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1>LOOKING TO GROW YOUR BUSINESS?</h1>
          <h2 style={{ fontSize: '2rem', fontWeight: '400', marginTop: '1rem' }}>Advertise with SUCCESS</h2>
        </section>

        {/* Stats Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>SUCCESS in numbers</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statNumber}>10M+</p>
              <p className={styles.statLabel}>Monthly Readers</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statNumber}>2.5M+</p>
              <p className={styles.statLabel}>Social Media Followers</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statNumber}>500K+</p>
              <p className={styles.statLabel}>Magazine Subscribers</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statNumber}>85%</p>
              <p className={styles.statLabel}>College Educated</p>
            </div>
          </div>
        </section>

        {/* Audience Section */}
        <section className={styles.sectionAlt}>
          <h2 className={styles.sectionTitle}>Our Audience</h2>
          <p className={styles.sectionSubtitle}>
            Connect with decision-makers who are actively seeking solutions for business growth and personal development
          </p>
          <div className={styles.audienceGrid}>
            <div className={styles.audienceCard}>
              <h3>🎯 Demographics</h3>
              <p>
                • Average Age: 35-54<br />
                • 60% Male, 40% Female<br />
                • Average Income: $125,000+<br />
                • 65% in Management Roles
              </p>
            </div>
            <div className={styles.audienceCard}>
              <h3>💼 Professional Profile</h3>
              <p>
                • Entrepreneurs & Business Owners<br />
                • C-Suite Executives<br />
                • Sales & Marketing Leaders<br />
                • Self-Employed Professionals
              </p>
            </div>
            <div className={styles.audienceCard}>
              <h3>📈 Engagement</h3>
              <p>
                • 8+ minutes average time on site<br />
                • 42% return visitors<br />
                • 3.5 pages per session<br />
                • Highly responsive to premium offers
              </p>
            </div>
          </div>
        </section>

        {/* Advertising Opportunities */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Integration Opportunities</h2>
          <div className={styles.opportunitiesGrid}>
            <div className={styles.opportunityCard}>
              <h3>SUCCESS magazine</h3>
              <p>A bimonthly print and digital publication featuring inspiring stories, exclusive interviews, and life-changing strategies to motivate readers to achieve their goals</p>
            </div>

            <div className={styles.opportunityCard}>
              <h3>SUCCESS+ magazine</h3>
              <p>A bimonthly digital-only publication that focuses on a specific topic—featuring insights from industry experts, practical strategies, and more—to help readers achieve their goals</p>
            </div>

            <div className={styles.opportunityCard}>
              <h3>Inside SUCCESS</h3>
              <p>A triweekly newsletter featuring the latest trends, sneak peeks into upcoming projects, and exclusive insights that only subscribers get to enjoy</p>
            </div>

            <div className={styles.opportunityCard}>
              <h3>2024 Women of Influence Awards</h3>
              <p>An annual awards program designed to spotlight extraordinary women whose contributions consistently transform lives and transcend boundaries</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <h2>Ready to Grow Your Brand?</h2>
          <p>
            Partner with SUCCESS Magazine and reach the audience that matters most to your business
          </p>
          <div className={styles.ctaButtons}>
            <a
              href="https://successcom.wpenginepowered.com/wp-content/uploads/2025/02/2025_MEDIA-KIT_Updated_2.25.pdf"
              className={styles.primaryButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Media Kit
            </a>
            <a
              href="https://successcom.wpenginepowered.com/wp-content/uploads/2025/02/2025_MEDIAKIT-Editorial-Calendar_At-a-Glance.pdf"
              className={styles.secondaryButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Editorial Calendar
            </a>
          </div>
          <div className={styles.contactLink}>
            <a href="mailto:advertising@success.com">
              Or contact us directly: advertising@success.com
            </a>
          </div>
        </section>

        {/* Contact Section */}
        <section className={styles.contactSection}>
          <div className={styles.contactInfo}>
            <h3>Get in Touch</h3>
            <p>
              <a href="mailto:advertising@success.com">advertising@success.com</a>
            </p>
            <div className={styles.contactDetails}>
              <p><strong>SUCCESS Enterprises</strong></p>
              <p>200 Swisher Road</p>
              <p>Lake Dallas, TX 75065</p>
              <p>Phone: (940) 497-9700</p>
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
