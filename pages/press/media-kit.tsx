import Link from 'next/link';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import styles from './MediaKit.module.css';

export default function MediaKitPage() {
  const assets = [
    {
      title: 'SUCCESS Logo (Black)',
      description: 'Primary logo for light backgrounds',
      formats: ['PNG', 'SVG', 'EPS'],
      thumbnail: '/images/logo-preview-black.png',
      downloadUrl: '/downloads/logos/success-logo-black.zip'
    },
    {
      title: 'SUCCESS Logo (White)',
      description: 'Logo for dark backgrounds',
      formats: ['PNG', 'SVG', 'EPS'],
      thumbnail: '/images/logo-preview-white.png',
      downloadUrl: '/downloads/logos/success-logo-white.zip'
    },
    {
      title: 'Brand Guidelines',
      description: 'Complete brand style guide and usage guidelines',
      formats: ['PDF'],
      thumbnail: '/images/brand-guidelines-preview.png',
      downloadUrl: '/downloads/SUCCESS-Brand-Guidelines.pdf'
    },
    {
      title: 'Magazine Covers',
      description: 'High-resolution current and past magazine covers',
      formats: ['JPG'],
      thumbnail: '/images/magazine-covers-preview.png',
      downloadUrl: '/downloads/magazine-covers.zip'
    },
  ];

  return (
    <Layout>
      <SEO
        title="Media Kit | SUCCESS"
        description="Download official SUCCESS logos, brand guidelines, and media assets"
        url="https://www.success.com/press/media-kit"
        type="website"
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/press" className={styles.backLink}>
            ← Back to Press
          </Link>
          <h1 className={styles.title}>Media Kit</h1>
          <p className={styles.subtitle}>
            Official SUCCESS logos, brand guidelines, and downloadable assets for media use
          </p>
        </header>

        {/* Brand Guidelines Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Brand Guidelines</h2>
          <div className={styles.guidelinesCard}>
            <div className={styles.guidelinesContent}>
              <h3 className={styles.cardTitle}>SUCCESS Brand Style Guide</h3>
              <p className={styles.cardDescription}>
                Our comprehensive brand guidelines include logo usage, color palette, typography,
                and editorial style. Please review these guidelines before using SUCCESS brand assets.
              </p>
              <div className={styles.guidelinesList}>
                <div className={styles.guidelineItem}>✓ Logo usage and clearspace</div>
                <div className={styles.guidelineItem}>✓ Official color palette</div>
                <div className={styles.guidelineItem}>✓ Typography guidelines</div>
                <div className={styles.guidelineItem}>✓ Editorial style</div>
              </div>
              <a
                href="/downloads/SUCCESS-Brand-Guidelines.pdf"
                className={styles.downloadButton}
                download
              >
                📄 Download Brand Guidelines (PDF)
              </a>
            </div>
          </div>
        </section>

        {/* Assets Grid */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Downloadable Assets</h2>
          <div className={styles.assetsGrid}>
            {assets.map((asset, index) => (
              <div key={index} className={styles.assetCard}>
                <div className={styles.assetThumbnail}>
                  <div className={styles.thumbnailPlaceholder}>
                    <span className={styles.placeholderIcon}>🖼️</span>
                    <span className={styles.placeholderText}>Preview</span>
                  </div>
                </div>
                <div className={styles.assetContent}>
                  <h3 className={styles.assetTitle}>{asset.title}</h3>
                  <p className={styles.assetDescription}>{asset.description}</p>
                  <div className={styles.assetFormats}>
                    {asset.formats.map((format, idx) => (
                      <span key={idx} className={styles.formatBadge}>
                        {format}
                      </span>
                    ))}
                  </div>
                  <a
                    href={asset.downloadUrl}
                    className={styles.assetDownload}
                    download
                  >
                    ⬇️ Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Usage Guidelines</h2>
          <div className={styles.usageCard}>
            <h3 className={styles.usageTitle}>Please Do:</h3>
            <ul className={styles.usageList}>
              <li>Use official SUCCESS logos and assets</li>
              <li>Maintain proper clearspace around logos</li>
              <li>Use approved color variations</li>
              <li>Ensure logos are legible at all sizes</li>
              <li>Contact us for permission to modify assets</li>
            </ul>

            <h3 className={styles.usageTitle}>Please Don't:</h3>
            <ul className={styles.usageList}>
              <li>Alter logo colors or proportions</li>
              <li>Add effects, shadows, or outlines to logos</li>
              <li>Use outdated logo versions</li>
              <li>Place logos on busy backgrounds</li>
              <li>Use logos to imply endorsement without permission</li>
            </ul>
          </div>
        </section>

        {/* Contact Section */}
        <section className={styles.contactSection}>
          <div className={styles.contactCard}>
            <h2 className={styles.contactTitle}>Need Custom Assets?</h2>
            <p className={styles.contactText}>
              For custom media requests, high-resolution photography, or questions about asset usage,
              please contact our communications team:
            </p>
            <a href="mailto:press@success.com" className={styles.contactButton}>
              📧 Contact Press Team
            </a>
          </div>
        </section>

        {/* Download All */}
        <section className={styles.downloadAllSection}>
          <h2 className={styles.downloadAllTitle}>Download Complete Media Kit</h2>
          <p className={styles.downloadAllText}>
            Get all logos, brand guidelines, and assets in one convenient package
          </p>
          <a
            href="/downloads/SUCCESS-Media-Kit-Complete.zip"
            className={styles.downloadAllButton}
            download
          >
            📦 Download Complete Kit (ZIP)
          </a>
        </section>
      </div>
    </Layout>
  );
}

// Force SSR for AWS Amplify deployment compatibility
export async function getServerSideProps() {
  return {
    props: {},
  };
}
