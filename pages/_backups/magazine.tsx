import Layout from '../components/Layout';
import styles from './Magazine.module.css';
import { fetchWordPressData } from '../lib/wordpress';

type MagazinePageProps = {
  currentIssue: any;
  pastIssues: any[];
};

export default function MagazinePage({ currentIssue, pastIssues }: MagazinePageProps) {

  return (
    <Layout>
      <div className={styles.magazine}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>SUCCESS Magazine</h1>
            <p className={styles.heroSubtitle}>
              125+ Years of Inspiration and Guidance
            </p>
          </div>
        </section>

        {/* Intro Text */}
        <section className={styles.section}>
          <div className={styles.container}>
            <p className={styles.introText}>
              Get proven life lessons from classic SUCCESS® magazine and topic-focused SUCCESS+ magazine.
              Order single print issues for unique expert advice on money, business, lifestyle, and more—mailed
              directly to your home. You can also become a SUCCESS+™ member to access the digital editions.
              All integrated into one easy-to-use, exclusive personal growth content platform.
            </p>
          </div>
        </section>

        {/* Current Issue */}
        {currentIssue && (
          <section className={styles.section}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>Current Issue</h2>
              <div className={styles.currentIssue}>
                <div className={styles.coverImage}>
                  {(currentIssue.meta_data?.['image-for-listing-page']?.[0] ||
                    currentIssue._embedded?.['wp:featuredmedia']?.[0]?.source_url) && (
                    <img
                      src={
                        currentIssue.meta_data?.['image-for-listing-page']?.[0] ||
                        currentIssue._embedded['wp:featuredmedia'][0].source_url
                      }
                      alt={currentIssue.title.rendered}
                      className={styles.cover}
                    />
                  )}
                </div>
                <div className={styles.issueDetails}>
                  {currentIssue.meta_data?.['magazine-published-text']?.[0] && (
                    <p className={styles.publishDate}>
                      {currentIssue.meta_data['magazine-published-text'][0]}
                    </p>
                  )}
                  <h3 className={styles.issueTitle}>
                    {currentIssue.title?.rendered || 'Current Issue'}
                  </h3>
                  {currentIssue.meta_data?.['magazine-banner-heading']?.[0] && (
                    <p className={styles.featureHeading}>
                      Featuring: {currentIssue.meta_data['magazine-banner-heading'][0]}
                    </p>
                  )}
                  {currentIssue.meta_data?.['magazine-banner-description']?.[0] && (
                    <p className={styles.issueDescription}>
                      {currentIssue.meta_data['magazine-banner-description'][0]}
                    </p>
                  )}
                  <div className={styles.buttonGroup}>
                    <a href="/subscribe" className={styles.subscribeButton}>
                      Subscribe Now
                    </a>
                    {currentIssue.meta_data?.['flip_version']?.[0] && (
                      <a
                        href={currentIssue.meta_data['flip_version'][0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.readButton}
                      >
                        Read Digital Edition
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Why Subscribe */}
        <section className={styles.section} style={{ backgroundColor: '#f9f9f9' }}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Why Subscribe?</h2>
            <div className={styles.benefitsGrid}>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>📰</div>
                <h3 className={styles.benefitTitle}>Print & Digital Access</h3>
                <p className={styles.benefitText}>
                  Get the magazine delivered to your door and enjoy unlimited digital access
                </p>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>🎯</div>
                <h3 className={styles.benefitTitle}>Exclusive Content</h3>
                <p className={styles.benefitText}>
                  Access subscriber-only articles, interviews, and resources
                </p>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>🎓</div>
                <h3 className={styles.benefitTitle}>Expert Insights</h3>
                <p className={styles.benefitText}>
                  Learn from industry leaders and successful entrepreneurs
                </p>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>🌟</div>
                <h3 className={styles.benefitTitle}>Actionable Strategies</h3>
                <p className={styles.benefitText}>
                  Practical advice you can implement in your business and life
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Archive */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Past Issues</h2>
            <div className={styles.archiveGrid}>
              {pastIssues.map((issue: any) => {
                // Prefer image-for-listing-page metadata over featured_media
                const coverUrl =
                  issue.meta_data?.['image-for-listing-page']?.[0] ||
                  issue._embedded?.['wp:featuredmedia']?.[0]?.source_url;

                return (
                  <div key={issue.id} className={styles.archiveItem}>
                    <div className={styles.archiveCover}>
                      {coverUrl && (
                        <img
                          src={coverUrl}
                          alt={issue.title?.rendered || 'Magazine Issue'}
                          className={styles.archiveCoverImage}
                        />
                      )}
                    </div>
                    <h4 className={styles.archiveTitle}>
                      {issue.title?.rendered || 'Magazine Issue'}
                    </h4>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  try {
    const magazines = await fetchWordPressData('magazines?per_page=100&_embed');
    const currentIssue = magazines && magazines.length > 0 ? magazines[0] : null;
    const pastIssues = magazines && magazines.length > 1 ? magazines.slice(1) : [];

    return {
      props: {
        currentIssue,
        pastIssues,
      }
    };
  } catch (error) {
    return {
      props: {
        currentIssue: null,
        pastIssues: [],
      }
    };
  }
}
