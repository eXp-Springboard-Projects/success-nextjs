import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from './Press.module.css';
import { fetchWordPressData } from '../lib/wordpress';
import { decodeHtmlEntities } from '../lib/htmlDecode';

type PressRelease = {
  id: number;
  slug: string;
  title: { rendered: string };
  date: string;
};

type PressPageProps = {
  recentReleases: PressRelease[];
};

export default function PressPage({ recentReleases }: PressPageProps) {
  return (
    <Layout>
      <SEO
        title="Press & Media | SUCCESS"
        description="Media inquiries, press releases, and brand assets for SUCCESS Magazine"
        url="https://www.success.com/press"
        type="website"
      />

      <div className={styles.container}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Press & Media</h1>
          <p className={styles.subtitle}>Media inquiries, brand assets, and the latest SUCCESS news</p>
        </header>

        <div className={styles.grid}>
          {/* About SUCCESS */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>About SUCCESS</h2>
            <p className={styles.paragraph}>
              SUCCESS is your trusted guide to the future of work. For over 130 years, SUCCESS has been
              the leading source of inspiration, motivation, and practical advice for entrepreneurs,
              business leaders, and professionals seeking personal and professional growth.
            </p>
            <p className={styles.paragraph}>
              SUCCESS magazine reaches millions of ambitious, growth-oriented readers through our print
              publication, digital platforms, and SUCCESS+ membership community. Our content features
              interviews with world-class achievers, practical business strategies, and insights on
              leadership, entrepreneurship, and personal development.
            </p>
          </section>

          {/* Media Kit */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Media Kit</h2>
            <p className={styles.paragraph}>
              Download our official media kit for logos, brand guidelines, and high-resolution assets.
            </p>
            <div className={styles.buttonGroup}>
              <Link href="/press/media-kit" className={styles.primaryButton}>
                📦 View Media Kit
              </Link>
              <a
                href="/downloads/SUCCESS-Media-Kit-2024.pdf"
                className={styles.secondaryButton}
                download
              >
                📄 Download PDF
              </a>
            </div>
          </section>
        </div>

        {/* Press Contact */}
        <section className={styles.contactSection}>
          <div className={styles.contactCard}>
            <h2 className={styles.contactTitle}>Media Inquiries</h2>
            <p className={styles.contactText}>
              For press inquiries, interviews, or media requests, please contact our communications team:
            </p>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <strong>Email:</strong>{' '}
                <a href="mailto:press@success.com" className={styles.contactLink}>
                  press@success.com
                </a>
              </div>
              <div className={styles.contactItem}>
                <strong>Phone:</strong> (214) 750-8400
              </div>
              <div className={styles.contactItem}>
                <strong>Address:</strong> 5473 Blair Rd., Suite 100, PMB 30053, Dallas, TX 75231
              </div>
            </div>
          </div>
        </section>

        {/* Recent Press Releases */}
        <section className={styles.releasesSection}>
          <div className={styles.releasesHeader}>
            <h2 className={styles.sectionTitle}>Recent Press Releases</h2>
            <Link href="/press-releases" className={styles.viewAllLink}>
              View All →
            </Link>
          </div>

          {recentReleases.length > 0 ? (
            <div className={styles.releasesList}>
              {recentReleases.map((release) => (
                <article key={release.id} className={styles.releaseItem}>
                  <time className={styles.releaseDate}>
                    {new Date(release.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                  <h3 className={styles.releaseTitle}>
                    <Link href={`/press-release/${release.slug}`}>
                      {decodeHtmlEntities(release.title.rendered)}
                    </Link>
                  </h3>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.noReleases}>No recent press releases available.</p>
          )}
        </section>

        {/* Social Media */}
        <section className={styles.socialSection}>
          <h2 className={styles.sectionTitle}>Follow SUCCESS</h2>
          <p className={styles.paragraph}>
            Stay updated on the latest SUCCESS news, partnerships, and announcements.
          </p>
          <div className={styles.socialLinks}>
            <a href="https://facebook.com/successmagazine" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <a href="https://twitter.com/successmagazine" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
              Twitter
            </a>
            <a href="https://instagram.com/successmagazine" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="https://linkedin.com/company/success-magazine" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  try {
    const pressReleases = await fetchWordPressData('press-releases?per_page=5&orderby=date&order=desc');

    return {
      props: {
        recentReleases: pressReleases || [],
      }
    };
  } catch (error) {
    return {
      props: {
        recentReleases: [],
      }
    };
  }
}
